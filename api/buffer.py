from http.server import BaseHTTPRequestHandler
import json
import math

# Common buffer pKa presets
PKA_PRESETS = {
    "Phosphate": 7.21,
    "Tris": 8.06,
    "Acetate": 4.76,
    "HEPES": 7.55,
    "MES": 6.10,
}


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress default access logs

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
        except Exception:
            self.send_json(400, {"error": "Request body tidak valid JSON."})
            return

        ph_target = data.get("ph_target")
        pka = data.get("pka")
        buffer_system = data.get("buffer_system", "").strip()
        konsentrasi_total_mM = data.get("konsentrasi_total_mM")
        volume_ml = data.get("volume_ml")

        # Resolve pKa: prefer explicit pka, else look up buffer_system
        if pka is None and buffer_system:
            if buffer_system not in PKA_PRESETS:
                valid = ", ".join(PKA_PRESETS.keys())
                self.send_json(400, {"error": f"Buffer system '{buffer_system}' tidak dikenal. Pilih: {valid}."})
                return
            pka = PKA_PRESETS[buffer_system]

        if pka is None:
            self.send_json(400, {"error": "Wajib menyertakan 'pka' atau 'buffer_system'."})
            return

        # Validate numeric inputs
        try:
            ph_target = float(ph_target)
            pka = float(pka)
            konsentrasi_total_mM = float(konsentrasi_total_mM)
            volume_ml = float(volume_ml)
        except (TypeError, ValueError):
            self.send_json(400, {"error": "Field ph_target, pka, konsentrasi_total_mM, dan volume_ml harus berupa angka."})
            return

        if konsentrasi_total_mM <= 0:
            self.send_json(400, {"error": "Konsentrasi total harus bernilai positif."})
            return

        if volume_ml <= 0:
            self.send_json(400, {"error": "Volume harus bernilai positif."})
            return

        if not (0 < ph_target < 14):
            self.send_json(400, {"error": "pH target harus berada di antara 0 dan 14."})
            return

        # Henderson-Hasselbalch: pH = pKa + log([A-]/[HA])
        # ratio = [A-]/[HA] = 10^(pH - pKa)
        ratio = 10 ** (ph_target - pka)

        # [A-] = total * ratio / (1 + ratio)
        # [HA] = total * 1 / (1 + ratio)
        konsentrasi_basa_mM = round(konsentrasi_total_mM * ratio / (1 + ratio), 4)
        konsentrasi_asam_mM = round(konsentrasi_total_mM * 1 / (1 + ratio), 4)

        volume_L = volume_ml / 1000.0
        mol_basa = round(konsentrasi_basa_mM * volume_L / 1000.0, 6)  # mmol → mol
        mol_asam = round(konsentrasi_asam_mM * volume_L / 1000.0, 6)
        mmol_basa = round(konsentrasi_basa_mM * volume_L, 4)
        mmol_asam = round(konsentrasi_asam_mM * volume_L, 4)

        ratio_display = round(ratio, 4)
        ph_check = round(pka + math.log10(ratio), 4)

        # Resolve buffer name for instructions
        buf_name = buffer_system if buffer_system else f"Buffer (pKa={pka})"
        asam_label = f"{buf_name} (asam, HA)"
        basa_label = f"{buf_name} (konjugat basa, A⁻)"

        instruksi = [
            f"1. Hitung kebutuhan komponen berdasarkan hasil di atas.",
            f"2. Timbang/ukur {basa_label} sebanyak yang sesuai dengan {konsentrasi_basa_mM} mM.",
            f"3. Timbang/ukur {asam_label} sebanyak yang sesuai dengan {konsentrasi_asam_mM} mM.",
            "4. Larutkan kedua komponen dalam ±80% volume aquades target.",
            f"5. Periksa pH dengan pH meter terkalibrasi — target pH {ph_target}.",
            "6. Sesuaikan pH jika perlu dengan menambah sedikit asam atau basa pekat.",
            f"7. Tambahkan aquades hingga volume akhir {volume_ml} mL.",
            "8. Sterilisasi dengan filter 0.22 μm atau autoclave sesuai kebutuhan.",
        ]

        result = {
            "ph_target": ph_target,
            "pka": pka,
            "buffer_system": buf_name,
            "konsentrasi_total_mM": konsentrasi_total_mM,
            "volume_ml": volume_ml,
            "ratio_basa_asam": ratio_display,
            "formula": f"pH = pKa + log([A⁻]/[HA]) → {ph_target} = {pka} + log({ratio_display})",
            "ph_check": ph_check,
            "konjugat_basa": {
                "label": basa_label,
                "konsentrasi_mM": konsentrasi_basa_mM,
                "mmol": mmol_basa,
                "mol": mol_basa,
            },
            "asam": {
                "label": asam_label,
                "konsentrasi_mM": konsentrasi_asam_mM,
                "mmol": mmol_asam,
                "mol": mol_asam,
            },
            "instruksi": instruksi,
            "pka_presets": PKA_PRESETS,
        }

        self.send_json(200, {"status": "ok", "data": result})

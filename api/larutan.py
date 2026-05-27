from http.server import BaseHTTPRequestHandler
import json
import math

# Embedded recipe data (more reliable than filesystem access in Vercel serverless)
RESEP_DB = {
    "pbs_1x": {
        "nama": "PBS 1× (Phosphate Buffered Saline)",
        "deskripsi": "Larutan isotonik universal untuk biologi sel dan biokimia. pH 7.4.",
        "ph_target": 7.4,
        "komposisi_per_liter": [
            {"senyawa": "NaCl", "mr": 58.44, "konsentrasi_mM": 137},
            {"senyawa": "KCl", "mr": 74.55, "konsentrasi_mM": 2.7},
            {"senyawa": "Na2HPO4", "mr": 141.96, "konsentrasi_mM": 10},
            {"senyawa": "KH2PO4", "mr": 136.09, "konsentrasi_mM": 1.8},
        ],
    },
    "tae_1x": {
        "nama": "TAE 1× (Tris-Acetate-EDTA)",
        "deskripsi": "Buffer untuk elektroforesis gel agarosa DNA.",
        "ph_target": 8.3,
        "komposisi_per_liter": [
            {"senyawa": "Tris Base", "mr": 121.14, "konsentrasi_mM": 40},
            {"senyawa": "Asam Asetat", "mr": 60.05, "konsentrasi_mM": 20},
            {"senyawa": "EDTA Disodium", "mr": 372.24, "konsentrasi_mM": 1},
        ],
    },
    "tbe_1x": {
        "nama": "TBE 1× (Tris-Borate-EDTA)",
        "deskripsi": "Buffer alternatif elektroforesis DNA, resolusi lebih tinggi untuk fragmen kecil.",
        "ph_target": 8.3,
        "komposisi_per_liter": [
            {"senyawa": "Tris Base", "mr": 121.14, "konsentrasi_mM": 89},
            {"senyawa": "Asam Borat", "mr": 61.83, "konsentrasi_mM": 89},
            {"senyawa": "EDTA Disodium", "mr": 372.24, "konsentrasi_mM": 2},
        ],
    },
    "tris_hcl_50mm": {
        "nama": "Tris-HCl Buffer 50 mM",
        "deskripsi": "Buffer protein umum. pH disesuaikan dengan HCl.",
        "ph_target": 7.5,
        "komposisi_per_liter": [
            {"senyawa": "Tris Base", "mr": 121.14, "konsentrasi_mM": 50},
        ],
    },
    "phosphate_100mm": {
        "nama": "Sodium Phosphate Buffer 100 mM",
        "deskripsi": "Buffer pH fisiologis untuk biokimia protein.",
        "ph_target": 7.0,
        "komposisi_per_liter": [
            {"senyawa": "Na2HPO4", "mr": 141.96, "konsentrasi_mM": 57.7},
            {"senyawa": "KH2PO4", "mr": 136.09, "konsentrasi_mM": 42.3},
        ],
    },
}


def build_instruksi(nama_larutan: str, volume_ml: float, ph_target: float) -> list:
    vol_80 = round(volume_ml * 0.8)
    instruksi = [
        f"1. Siapkan gelas beaker bersih berkapasitas ≥{volume_ml} mL.",
        f"2. Tambahkan ±80% volume aquades (±{vol_80} mL) ke dalam gelas beaker.",
        "3. Tambahkan setiap komponen satu per satu sambil diaduk dengan magnetic stirrer hingga larut sempurna.",
        f"4. Sesuaikan pH ke {ph_target} menggunakan HCl 1 M (untuk menurunkan pH) atau NaOH 1 M (untuk menaikkan pH). Gunakan pH meter yang sudah dikalibrasi.",
        f"5. Tambahkan aquades hingga tepat volume akhir {volume_ml} mL.",
        "6. Sterilisasi dengan autoclave (121°C, 15 menit) atau filter steril 0.22 μm.",
        "7. Simpan pada suhu 4°C atau suhu ruang sesuai kebutuhan.",
    ]
    return instruksi


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

        id_larutan = data.get("id_larutan", "").strip()
        volume_akhir_ml = data.get("volume_akhir_ml")
        konsentrasi_x = data.get("konsentrasi_x", 1)

        # Validations
        if not id_larutan:
            self.send_json(400, {"error": "Field 'id_larutan' wajib diisi."})
            return

        if id_larutan not in RESEP_DB:
            valid = ", ".join(RESEP_DB.keys())
            self.send_json(400, {"error": f"ID larutan '{id_larutan}' tidak ditemukan. Pilih salah satu: {valid}."})
            return

        try:
            volume_akhir_ml = float(volume_akhir_ml)
            konsentrasi_x = float(konsentrasi_x)
        except (TypeError, ValueError):
            self.send_json(400, {"error": "Field 'volume_akhir_ml' dan 'konsentrasi_x' harus berupa angka."})
            return

        if volume_akhir_ml <= 0:
            self.send_json(400, {"error": "Volume akhir harus bernilai positif."})
            return

        if konsentrasi_x <= 0:
            self.send_json(400, {"error": "Konsentrasi (x) harus bernilai positif."})
            return

        resep = RESEP_DB[id_larutan]
        volume_L = volume_akhir_ml / 1000.0

        komponen = []
        for k in resep["komposisi_per_liter"]:
            # massa_g = (konsentrasi_mM * konsentrasi_x * volume_L * Mr) / 1000
            massa_g = (k["konsentrasi_mM"] * konsentrasi_x * volume_L * k["mr"]) / 1000.0
            konsentrasi_final = round(k["konsentrasi_mM"] * konsentrasi_x, 4)
            komponen.append({
                "senyawa": k["senyawa"],
                "mr": k["mr"],
                "massa_g": round(massa_g, 4),
                "massa_mg": round(massa_g * 1000, 4),
                "konsentrasi_final_mM": konsentrasi_final,
            })

        instruksi = build_instruksi(resep["nama"], volume_akhir_ml, resep["ph_target"])

        result = {
            "nama_larutan": resep["nama"],
            "deskripsi": resep["deskripsi"],
            "volume_akhir_ml": volume_akhir_ml,
            "konsentrasi_x": konsentrasi_x,
            "ph_target": resep["ph_target"],
            "komponen": komponen,
            "instruksi": instruksi,
        }

        self.send_json(200, {"status": "ok", "data": result})

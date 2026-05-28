from http.server import BaseHTTPRequestHandler
import json
import math


def validate_positive(*values):
    """Raise ValueError with message if any value is not positive."""
    for name, val in values:
        if val is None:
            raise ValueError(f"Field '{name}' wajib diisi.")
        try:
            val = float(val)
        except (TypeError, ValueError):
            raise ValueError(f"Field '{name}' harus berupa angka.")
        if val <= 0:
            raise ValueError(f"Field '{name}' harus bernilai positif (> 0).")
    return True


def r4(x):
    """Round to 4 decimal places."""
    return round(x, 4)


def mode_massa_ke_mol(data):
    massa_g = float(data.get("massa_g", 0))
    mr = float(data.get("mr", 0))
    validate_positive(("massa_g", massa_g), ("mr", mr))

    mol = massa_g / mr
    milimol = mol * 1000
    formula = f"n = m/Mr → n = {massa_g}/{mr} = {r4(mol)} mol"

    return {
        "mol": r4(mol),
        "milimol": r4(milimol),
        "formula": formula,
        "breakdown": [
            {"label": "Mol (n)", "value": f"{r4(mol)} mol"},
            {"label": "Milimol (mmol)", "value": f"{r4(milimol)} mmol"},
            {"label": "Mr yang digunakan", "value": f"{mr} g/mol"},
        ]
    }


def mode_mol_ke_massa(data):
    mol = float(data.get("mol", 0))
    mr = float(data.get("mr", 0))
    validate_positive(("mol", mol), ("mr", mr))

    massa_g = mol * mr
    massa_mg = massa_g * 1000
    formula = f"m = n × Mr → m = {mol} × {mr} = {r4(massa_g)} g"

    return {
        "massa_g": r4(massa_g),
        "massa_mg": r4(massa_mg),
        "formula": formula,
        "breakdown": [
            {"label": "Massa (g)", "value": f"{r4(massa_g)} g"},
            {"label": "Massa (mg)", "value": f"{r4(massa_mg)} mg"},
            {"label": "Mr yang digunakan", "value": f"{mr} g/mol"},
        ]
    }


def mode_molaritas(data):
    massa_g = float(data.get("massa_g", 0))
    mr = float(data.get("mr", 0))
    volume_ml = float(data.get("volume_ml", 0))
    validate_positive(("massa_g", massa_g), ("mr", mr), ("volume_ml", volume_ml))

    volume_l = volume_ml / 1000
    mol = massa_g / mr
    molaritas_M = mol / volume_l
    milimolaritas_mM = molaritas_M * 1000
    formula = (
        f"M = (m/Mr)/V(L) → "
        f"M = ({massa_g}/{mr})/{volume_l} = {r4(molaritas_M)} M"
    )

    return {
        "molaritas_M": r4(molaritas_M),
        "milimolaritas_mM": r4(milimolaritas_mM),
        "mol": r4(mol),
        "formula": formula,
        "breakdown": [
            {"label": "Molaritas (M)", "value": f"{r4(molaritas_M)} M"},
            {"label": "Milimolaritas (mM)", "value": f"{r4(milimolaritas_mM)} mM"},
            {"label": "Jumlah mol", "value": f"{r4(mol)} mol"},
            {"label": "Volume larutan", "value": f"{volume_ml} mL = {volume_l} L"},
        ]
    }


def mode_dilusi(data):
    c1 = float(data.get("c1", 0))
    c2 = float(data.get("c2", 0))
    v2_ml = float(data.get("v2_ml", 0))
    validate_positive(("c1", c1), ("c2", c2), ("v2_ml", v2_ml))

    if c1 <= c2:
        raise ValueError(
            "Konsentrasi stock (C1) harus lebih tinggi dari working solution (C2)."
        )

    v1_ml = (c2 * v2_ml) / c1
    v_pelarut_ml = v2_ml - v1_ml
    formula = (
        f"C₁V₁ = C₂V₂ → V₁ = (C₂×V₂)/C₁ = "
        f"({c2}×{v2_ml})/{c1} = {r4(v1_ml)} mL"
    )

    return {
        "v1_ml": r4(v1_ml),
        "v_pelarut_ml": r4(v_pelarut_ml),
        "formula": formula,
        "breakdown": [
            {"label": "Volume stock (V₁)", "value": f"{r4(v1_ml)} mL"},
            {"label": "Volume pelarut ditambahkan", "value": f"{r4(v_pelarut_ml)} mL"},
            {"label": "Volume akhir (V₂)", "value": f"{v2_ml} mL"},
            {"label": "Faktor pengenceran", "value": f"{r4(c1/c2)}×"},
        ]
    }


def mode_serial_dilusi(data):
    c_awal = float(data.get("c_awal", 0))
    faktor = float(data.get("faktor", 0))
    n_tahap = int(data.get("n_tahap", 0))
    volume_per_tabung_ml = float(data.get("volume_per_tabung_ml", 0))
    validate_positive(
        ("c_awal", c_awal),
        ("faktor", faktor),
        ("volume_per_tabung_ml", volume_per_tabung_ml),
    )
    if n_tahap <= 0:
        raise ValueError("Jumlah tahap harus bilangan bulat positif.")
    if n_tahap > 20:
        raise ValueError("Jumlah tahap maksimum adalah 20.")
    if faktor <= 1:
        raise ValueError("Faktor pengenceran harus lebih besar dari 1.")

    steps = []
    c_prev = c_awal

    for i in range(1, n_tahap + 1):
        c_curr = c_prev / faktor
        v_stock = volume_per_tabung_ml / faktor
        v_pelarut = volume_per_tabung_ml - v_stock
        steps.append({
            "tahap": i,
            "konsentrasi": r4(c_curr),
            "v_stock_ml": r4(v_stock),
            "v_pelarut_ml": r4(v_pelarut),
            "instruksi": (
                f"Ambil {r4(v_stock)} mL dari tabung sebelumnya, "
                f"tambahkan {r4(v_pelarut)} mL pelarut → [C] = {r4(c_curr)}"
            )
        })
        c_prev = c_curr

    formula = f"Cn = C₀ / faktor^n → faktor = {faktor}×, {n_tahap} tahap"

    return {
        "c_awal": c_awal,
        "faktor": faktor,
        "n_tahap": n_tahap,
        "steps": steps,
        "formula": formula,
        "breakdown": [
            {"label": "Konsentrasi awal", "value": f"{c_awal}"},
            {"label": "Faktor pengenceran", "value": f"{faktor}×"},
            {"label": "Jumlah tahap", "value": str(n_tahap)},
            {"label": "Konsentrasi akhir", "value": str(r4(steps[-1]["konsentrasi"]))},
        ]
    }


MODES = {
    "massa_ke_mol": mode_massa_ke_mol,
    "mol_ke_massa": mode_mol_ke_massa,
    "molaritas": mode_molaritas,
    "dilusi": mode_dilusi,
    "serial_dilusi": mode_serial_dilusi,
}


class handler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            mode = data.get("mode", "").strip()
            if mode not in MODES:
                self._respond(400, {
                    "error": f"Mode tidak dikenal: '{mode}'. "
                             f"Pilihan valid: {', '.join(MODES.keys())}"
                })
                return

            result = MODES[mode](data)
            self._respond(200, {"status": "ok", "mode": mode, "data": result})

        except ValueError as e:
            self._respond(400, {"error": str(e)})
        except Exception as e:
            self._respond(500, {"error": f"Internal server error: {str(e)}"})

    def _respond(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Suppress default request logging

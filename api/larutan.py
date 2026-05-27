"""
Modul kalkulasi resep larutan biologis standar.
Algoritma Python untuk laporan IEEE — Tugas Besar KDS K02 Kelompok 6.

Endpoint web diimplementasikan di app/api/larutan/route.ts (Next.js Route Handler).
File ini dapat dijalankan langsung: python api/larutan.py
"""

RESEP_DB = {
    "pbs_1x": {
        "nama": "PBS 1× (Phosphate Buffered Saline)",
        "deskripsi": "Larutan isotonik universal untuk biologi sel dan biokimia.",
        "ph_target": 7.4,
        "komposisi_per_liter": [
            {"senyawa": "NaCl",     "mr": 58.44,  "konsentrasi_mM": 137},
            {"senyawa": "KCl",      "mr": 74.55,  "konsentrasi_mM": 2.7},
            {"senyawa": "Na2HPO4", "mr": 141.96, "konsentrasi_mM": 10},
            {"senyawa": "KH2PO4", "mr": 136.09, "konsentrasi_mM": 1.8},
        ],
    },
    "tae_1x": {
        "nama": "TAE 1× (Tris-Acetate-EDTA)",
        "deskripsi": "Buffer untuk elektroforesis gel agarosa DNA.",
        "ph_target": 8.3,
        "komposisi_per_liter": [
            {"senyawa": "Tris Base",     "mr": 121.14, "konsentrasi_mM": 40},
            {"senyawa": "Asam Asetat",   "mr": 60.05,  "konsentrasi_mM": 20},
            {"senyawa": "EDTA Disodium", "mr": 372.24, "konsentrasi_mM": 1},
        ],
    },
    "tbe_1x": {
        "nama": "TBE 1× (Tris-Borate-EDTA)",
        "deskripsi": "Buffer alternatif elektroforesis DNA.",
        "ph_target": 8.3,
        "komposisi_per_liter": [
            {"senyawa": "Tris Base",     "mr": 121.14, "konsentrasi_mM": 89},
            {"senyawa": "Asam Borat",    "mr": 61.83,  "konsentrasi_mM": 89},
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


def hitung_resep(id_larutan: str, volume_akhir_ml: float, konsentrasi_x: float = 1.0) -> dict:
    """
    Hitung kebutuhan massa tiap komponen untuk membuat larutan biologis standar.

    Rumus: massa_g = (konsentrasi_mM * konsentrasi_x * volume_L * Mr) / 1000

    Args:
        id_larutan: ID resep (pbs_1x, tae_1x, tbe_1x, tris_hcl_50mm, phosphate_100mm)
        volume_akhir_ml: Volume akhir larutan dalam mL
        konsentrasi_x: Faktor konsentrasi (1 untuk 1×, 10 untuk 10×, dst.)

    Returns:
        dict berisi nama larutan, daftar komponen beserta massa, dan pH target
    """
    if id_larutan not in RESEP_DB:
        raise ValueError(f"ID larutan '{id_larutan}' tidak ditemukan. Pilih: {list(RESEP_DB.keys())}")
    if volume_akhir_ml <= 0:
        raise ValueError("Volume akhir harus bernilai positif.")
    if konsentrasi_x <= 0:
        raise ValueError("Konsentrasi (x) harus bernilai positif.")

    resep = RESEP_DB[id_larutan]
    volume_L = volume_akhir_ml / 1000.0

    komponen = []
    for k in resep["komposisi_per_liter"]:
        massa_g = (k["konsentrasi_mM"] * konsentrasi_x * volume_L * k["mr"]) / 1000.0
        komponen.append({
            "senyawa": k["senyawa"],
            "mr": k["mr"],
            "massa_g": round(massa_g, 4),
            "massa_mg": round(massa_g * 1000, 4),
            "konsentrasi_final_mM": round(k["konsentrasi_mM"] * konsentrasi_x, 4),
        })

    return {
        "nama_larutan": resep["nama"],
        "volume_akhir_ml": volume_akhir_ml,
        "konsentrasi_x": konsentrasi_x,
        "ph_target": resep["ph_target"],
        "komponen": komponen,
    }


if __name__ == "__main__":
    print("=" * 55)
    print("  Generator Resep Larutan Biologis — KDS K02 Kelompok 6")
    print("=" * 55)

    contoh = [
        ("pbs_1x", 500, 1),
        ("tae_1x", 1000, 1),
        ("tbe_1x", 500, 1),
    ]

    for id_l, vol, kx in contoh:
        hasil = hitung_resep(id_l, vol, kx)
        print(f"\n{hasil['nama_larutan']} — {vol} mL ({kx}×), pH {hasil['ph_target']}")
        print(f"  {'Senyawa':<20} {'Massa (g)':>10}  {'Massa (mg)':>11}  {'Konsentrasi':>14}")
        print(f"  {'-'*20} {'-'*10}  {'-'*11}  {'-'*14}")
        for k in hasil["komponen"]:
            print(f"  {k['senyawa']:<20} {k['massa_g']:>10}  {k['massa_mg']:>11}  {k['konsentrasi_final_mM']:>10} mM")

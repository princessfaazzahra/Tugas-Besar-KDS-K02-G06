"""
Modul kalkulasi buffer Henderson-Hasselbalch.
Algoritma Python untuk laporan IEEE — Tugas Besar KDS K02 Kelompok 6.

Endpoint web diimplementasikan di app/api/buffer/route.ts (Next.js Route Handler).
File ini dapat dijalankan langsung: python api/buffer.py
"""

import math

PKA_PRESETS = {
    "Phosphate": 7.21,
    "Tris":      8.06,
    "Acetate":   4.76,
    "HEPES":     7.55,
    "MES":       6.10,
}


def hitung_buffer(
    ph_target: float,
    konsentrasi_total_mM: float,
    volume_ml: float,
    pka: float = None,
    buffer_system: str = None,
) -> dict:
    """
    Hitung komposisi buffer menggunakan persamaan Henderson-Hasselbalch.

    pH = pKa + log([A-] / [HA])

    Diselesaikan untuk:
        ratio   = 10^(pH - pKa)
        [A-]    = C_total * ratio / (1 + ratio)
        [HA]    = C_total * 1     / (1 + ratio)

    Args:
        ph_target: pH target larutan buffer
        konsentrasi_total_mM: Konsentrasi total buffer (mM)
        volume_ml: Volume larutan yang akan dibuat (mL)
        pka: nilai pKa manual (opsional jika buffer_system diberikan)
        buffer_system: nama sistem buffer preset (Phosphate/Tris/Acetate/HEPES/MES)

    Returns:
        dict berisi konsentrasi asam dan konjugat basa dalam mM, mmol, dan mol
    """
    if pka is None and buffer_system is not None:
        if buffer_system not in PKA_PRESETS:
            raise ValueError(f"Buffer system '{buffer_system}' tidak dikenal. Pilih: {list(PKA_PRESETS.keys())}")
        pka = PKA_PRESETS[buffer_system]

    if pka is None:
        raise ValueError("Wajib menyertakan 'pka' atau 'buffer_system'.")
    if not (0 < ph_target < 14):
        raise ValueError("pH target harus berada di antara 0 dan 14.")
    if konsentrasi_total_mM <= 0:
        raise ValueError("Konsentrasi total harus bernilai positif.")
    if volume_ml <= 0:
        raise ValueError("Volume harus bernilai positif.")

    ratio = 10 ** (ph_target - pka)
    konsentrasi_basa_mM = round(konsentrasi_total_mM * ratio / (1 + ratio), 4)
    konsentrasi_asam_mM = round(konsentrasi_total_mM / (1 + ratio), 4)

    volume_L = volume_ml / 1000.0
    buf_name = buffer_system or f"Buffer (pKa={pka})"

    return {
        "ph_target": ph_target,
        "pka": pka,
        "buffer_system": buf_name,
        "ratio_basa_asam": round(ratio, 4),
        "formula": f"pH = pKa + log([A-]/[HA])  →  {ph_target} = {pka} + log({round(ratio, 4)})",
        "konjugat_basa": {
            "konsentrasi_mM": konsentrasi_basa_mM,
            "mmol": round(konsentrasi_basa_mM * volume_L, 4),
            "mol": round(konsentrasi_basa_mM * volume_L / 1000, 6),
        },
        "asam": {
            "konsentrasi_mM": konsentrasi_asam_mM,
            "mmol": round(konsentrasi_asam_mM * volume_L, 4),
            "mol": round(konsentrasi_asam_mM * volume_L / 1000, 6),
        },
    }


if __name__ == "__main__":
    print("=" * 55)
    print("  Kalkulator Buffer Henderson-Hasselbalch")
    print("  KDS K02 Kelompok 6")
    print("=" * 55)

    contoh = [
        (7.4, 100, 500, "Phosphate"),
        (8.0, 50,  250, "Tris"),
        (5.0, 200, 100, "Acetate"),
    ]

    for ph, c_total, vol, buf in contoh:
        hasil = hitung_buffer(ph, c_total, vol, buffer_system=buf)
        print(f"\n{hasil['buffer_system']}  |  pH {ph}  |  {c_total} mM total  |  {vol} mL")
        print(f"  {hasil['formula']}")
        print(f"  Konjugat basa [A-] : {hasil['konjugat_basa']['konsentrasi_mM']} mM  "
              f"({hasil['konjugat_basa']['mmol']} mmol)")
        print(f"  Asam         [HA]  : {hasil['asam']['konsentrasi_mM']} mM  "
              f"({hasil['asam']['mmol']} mmol)")

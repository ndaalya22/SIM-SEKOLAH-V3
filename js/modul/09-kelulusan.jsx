// ===== Modul Kelulusan: Naik Kelas & Kelulusan, Arsip Berkas Lulusan (KK, Akte, Ijazah, SKL, Rapor) =====
// Bergantung pada: JS_Core (useDB, apiPanggil, Modal, useAksi, KosongInfo, showAlert, tingkatDariKelas, tanggalPanjang,
// kecilkanGambar, bacaBase64) dan JS_Akademik (useLulusan). Dimuat SESUDAH JS_AgendaPrestasi dan SEBELUM JS_App.

const KL_LABEL_AKSI = { naik: 'Naik Kelas', tinggal: 'Tinggal Kelas', lulus: 'Lulus', tidaklulus: 'Tidak Lulus' };
const KL_WARNA_AKSI = { naik: 'bg-green-100 text-green-700', tinggal: 'bg-yellow-100 text-yellow-700', lulus: 'bg-blue-100 text-blue-700', tidaklulus: 'bg-red-100 text-red-700' };
const klTahunBerikut = (ta) => { const m = /^(\d{4})\s*\/\s*(\d{4})$/.exec(String(ta || '').trim()); return m ? `${Number(m[1]) + 1}/${Number(m[2]) + 1}` : ''; };
const klHurufKelas = (kelas) => { const m = /^\s*\d+\s*([A-Za-z])\b/.exec(String(kelas || '')); return m ? m[1].toUpperCase() : ''; };   // "6A - Abu Bakar" → "A"
const klUkuran = (b) => (Number(b) > 1048576 ? `${(Number(b) / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(Number(b) / 1024))} KB`);
const klBlob = (b64, mime) => { const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); };

// ---------------------------------------------------------------------------
// NAIK KELAS & KELULUSAN (admin & kepala sekolah)
// ---------------------------------------------------------------------------
const NaikKelasKelulusan = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const [proses, jalankan] = useAksi();
  const [tab, setTab] = useState('proses');
  const [tahunLama, setTahunLama] = useState(sekolah.tahunAjaran || '');
  const [tahunBaru, setTahunBaru] = useState(klTahunBerikut(sekolah.tahunAjaran));
  const [ubahTA, setUbahTA] = useState(true);
  const [ubahan, setUbahan] = useState({});                 // { nisn: { aksi, kelasBaru } } — hanya yang diubah manual
  const [riwayat, setRiwayat] = useState([]);
  const [riwayatSiap, setRiwayatSiap] = useState(false);
  const [buka, setBuka] = useState('');

  const rombel = useMemo(() => [...DB.rows('Rombel')].map((r) => r.kelas).sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })), [DB.rows('Rombel')]);
  const rombelTingkat = (t) => rombel.filter((k) => tingkatDariKelas(k) === t);
  const tujuanDefault = (kelas, t) => { const daftar = rombelTingkat(t); const huruf = klHurufKelas(kelas); return daftar.find((k) => huruf && klHurufKelas(k) === huruf) || daftar[0] || ''; };

  const aktif = DB.rows('Siswa').filter((s) => !['Nonaktif', 'Pindah', 'Lulus'].includes(s.status));
  const bisaDiproses = aktif.filter((s) => { const t = tingkatDariKelas(s.kelas); return t >= 1 && t <= 6; });
  const tanpaKelas = aktif.length - bisaDiproses.length;

  const efektif = (s) => {
    const t = tingkatDariKelas(s.kelas), o = ubahan[s.nisn] || {};
    const aksi = o.aksi || (t >= 6 ? 'lulus' : 'naik');
    const kelasBaru = o.kelasBaru || (aksi === 'naik' ? tujuanDefault(s.kelas, t + 1) : aksi === 'tinggal' ? s.kelas : '');
    return { aksi, kelasBaru };
  };
  const atur = (nisn, bagian) => setUbahan((x) => ({ ...x, [nisn]: { ...(x[nisn] || {}), ...bagian } }));
  const aturAksi = (nisn, aksi) => setUbahan((x) => ({ ...x, [nisn]: { aksi, kelasBaru: '' } }));

  const kelompok = useMemo(() => {
    const peta = {};
    bisaDiproses.forEach((s) => { (peta[s.kelas] = peta[s.kelas] || []).push(s); });
    return Object.keys(peta).sort((a, b) => tingkatDariKelas(a) - tingkatDariKelas(b) || String(a).localeCompare(String(b), 'id', { numeric: true }))
      .map((k) => ({ kelas: k, tingkat: tingkatDariKelas(k), siswa: peta[k].sort((a, b) => String(a.nama).localeCompare(String(b.nama))) }));
  }, [DB.rows('Siswa')]);

  const rencana = bisaDiproses.map((s) => ({ s, ...efektif(s) }));
  const hitung = { naik: 0, tinggal: 0, lulus: 0, tidaklulus: 0 };
  rencana.forEach((r) => { hitung[r.aksi]++; });
  const masalah = rencana.filter((r) => (r.aksi === 'naik' || r.aksi === 'tinggal') && !r.kelasBaru).length;
  const tahunSah = /^\d{4}\/\d{4}$/.test(tahunLama) && (!ubahTA || /^\d{4}\/\d{4}$/.test(tahunBaru));

  const aturKelompok = (kelompokItem, aksi, kelasBaru) => setUbahan((x) => {
    const baru = { ...x };
    kelompokItem.siswa.forEach((s) => { baru[s.nisn] = { aksi, kelasBaru: kelasBaru || '' }; });
    return baru;
  });

  const muatRiwayat = () => apiPanggil('riwayatKelas').then((res) => { setRiwayat(res.data); setRiwayatSiap(true); }).catch((e) => { showAlert('Gagal memuat riwayat: ' + e.message, 'error'); setRiwayatSiap(true); });
  useEffect(() => { muatRiwayat(); }, []);

  const jalankanProses = () => {
    if (!rencana.length) return showAlert('Tidak ada siswa yang dapat diproses.', 'error');
    if (masalah) return showAlert(`${masalah} siswa belum punya kelas tujuan. Tambahkan rombel tujuan di Pengaturan atau pilih Tinggal Kelas.`, 'error');
    if (!tahunSah) return showAlert('Isi tahun ajaran dengan format 2026/2027.', 'error');
    const ringkas = `${hitung.naik} naik kelas, ${hitung.tinggal} tinggal kelas, ${hitung.lulus} lulus, ${hitung.tidaklulus} tidak lulus`;
    if (!confirm(`Proses kenaikan kelas tahun ajaran ${tahunLama}?\n\n${ringkas}.\n\nKelas siswa akan berubah sekarang. Proses ini dapat dibatalkan (hanya proses terakhir) lewat tab Riwayat.`)) return;
    jalankan(async () => {
      const items = rencana.map((r) => ({ nisn: r.s.nisn, dari: r.s.kelas, aksi: r.aksi, kelasBaru: r.kelasBaru }));
      const res = await apiPanggil('prosesNaikKelas', { tahunAjaran: tahunLama, items });
      showAlert(res.message);
      if (ubahTA && tahunBaru && tahunBaru !== sekolah.tahunAjaran) await DB.simpanPengaturan({ tahunAjaran: tahunBaru });
      await DB.muatUlang();
    });
  };

  const batch = useMemo(() => {
    const urut = [], peta = {};
    riwayat.forEach((r) => { if (!peta[r.batch]) { peta[r.batch] = { batch: r.batch, tanggal: r.tanggal, tahunAjaran: r.tahunAjaran, oleh: r.oleh, dibatalkan: r.dibatalkan, baris: [] }; urut.push(peta[r.batch]); } peta[r.batch].baris.push(r); });
    return urut.reverse();
  }, [riwayat]);
  const batchTerakhir = (batch.find((b) => !b.dibatalkan) || {}).batch;
  const batalkan = (b) => {
    if (!confirm(`Batalkan proses ${b.tahunAjaran} (${b.baris.length} siswa)? Kelas dan status siswa dikembalikan seperti sebelum proses.`)) return;
    jalankan(async () => { const res = await apiPanggil('batalNaikKelas', { batch: b.batch }); showAlert(res.message); await DB.muatUlang(); });
  };

  const sel = 'border p-1.5 rounded text-xs bg-white';
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-2 items-center justify-between no-print">
        <div className="flex gap-1">
          {[['proses', 'Proses Kenaikan', 'fa-stairs'], ['riwayat', 'Riwayat', 'fa-history']].map(([k, l, ik]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded font-bold text-sm ${tab === k ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}><i className={`fas ${ik} mr-1`}></i> {l}</button>
          ))}
        </div>
        <p className="text-xs text-gray-500">Jalankan di akhir tahun ajaran, setelah rapor semester 2 selesai.</p>
      </div>

      {tab === 'proses' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4 items-end no-print">
            <div><label className="text-xs font-semibold text-gray-600">Tahun ajaran yang diakhiri</label><input value={tahunLama} onChange={(e) => setTahunLama(e.target.value)} placeholder="2026/2027" className="w-full border p-2 rounded text-sm mt-1" /></div>
            <div><label className="text-xs font-semibold text-gray-600">Tahun ajaran baru</label><input value={tahunBaru} onChange={(e) => setTahunBaru(e.target.value)} placeholder="2027/2028" disabled={!ubahTA} className="w-full border p-2 rounded text-sm mt-1 disabled:bg-gray-100" /></div>
            <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={ubahTA} onChange={(e) => setUbahTA(e.target.checked)} className="mt-0.5" /><span>Ubah Tahun Ajaran aktif di Pengaturan menjadi tahun ajaran baru setelah proses selesai.</span></label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1 no-print">
            <p><i className="fas fa-info-circle mr-1"></i>Semua siswa aktif otomatis <b>naik kelas</b> (kelas 6 → <b>lulus</b>). Ubah per siswa bila ada yang tinggal kelas atau tidak lulus.</p>
            <p>Kelas tujuan diambil dari <b>Pengaturan → Rombel</b> (kelas satu tingkat di atasnya, huruf rombel yang sama diprioritaskan). Siswa lulus: status menjadi <b>Lulus</b> dan kelasnya dikosongkan; kelas lamanya tersimpan di Riwayat.</p>
          </div>

          {tanpaKelas > 0 && <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-xs text-yellow-800 no-print"><i className="fas fa-exclamation-triangle mr-1"></i>{tanpaKelas} siswa aktif belum memiliki kelas yang valid dan tidak ikut diproses. Atur kelasnya di Data Siswa.</div>}
          {masalah > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700 no-print"><i className="fas fa-exclamation-circle mr-1"></i>{masalah} siswa belum punya kelas tujuan: rombel tingkat berikutnya belum ada. Tambahkan di Pengaturan → Rombel, atau ubah menjadi Tinggal Kelas.</div>}

          {kelompok.length === 0 ? <KosongInfo teks="Belum ada siswa aktif dengan kelas yang valid." /> : kelompok.map((kel) => {
            const tujuan = kel.tingkat < 6 ? rombelTingkat(kel.tingkat + 1) : [];
            return (
              <div key={kel.kelas} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-gray-700">{kel.kelas} <span className="font-normal text-gray-500">· {kel.siswa.length} siswa</span></h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {kel.tingkat < 6 ? (
                      <>
                        <button onClick={() => aturKelompok(kel, 'naik', '')} className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded font-bold">Naik semua</button>
                        <button onClick={() => aturKelompok(kel, 'tinggal', kel.kelas)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1 rounded font-bold">Tinggal semua</button>
                        {tujuan.length > 1 && (
                          <select defaultValue="" onChange={(e) => { if (e.target.value) { aturKelompok(kel, 'naik', e.target.value); e.target.value = ''; } }} className={sel}>
                            <option value="">Semua naik ke…</option>{tujuan.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        )}
                      </>
                    ) : (
                      <>
                        <button onClick={() => aturKelompok(kel, 'lulus', '')} className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-bold">Lulus semua</button>
                        <button onClick={() => aturKelompok(kel, 'tidaklulus', '')} className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-bold">Tidak lulus semua</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-xs text-gray-500"><tr><th className="p-2 w-10 text-center">No</th><th className="p-2">Nama</th><th className="p-2">NISN</th><th className="p-2">Keputusan</th><th className="p-2">Kelas tujuan</th></tr></thead>
                    <tbody>
                      {kel.siswa.map((s, i) => {
                        const e = efektif(s);
                        const opsiTujuan = e.aksi === 'naik' ? rombelTingkat(kel.tingkat + 1) : e.aksi === 'tinggal' ? rombelTingkat(kel.tingkat) : [];
                        return (
                          <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-2 text-center text-gray-500">{i + 1}</td>
                            <td className="p-2 font-medium">{s.nama}</td>
                            <td className="p-2 text-xs text-gray-500">{s.nisn}</td>
                            <td className="p-2">
                              <select value={e.aksi} onChange={(ev) => aturAksi(s.nisn, ev.target.value)} className={`${sel} font-semibold ${KL_WARNA_AKSI[e.aksi]}`}>
                                {(kel.tingkat < 6 ? ['naik', 'tinggal'] : ['lulus', 'tidaklulus']).map((a) => <option key={a} value={a}>{KL_LABEL_AKSI[a]}</option>)}
                              </select>
                            </td>
                            <td className="p-2">
                              {opsiTujuan.length ? (
                                <select value={e.kelasBaru} onChange={(ev) => atur(s.nisn, { kelasBaru: ev.target.value })} className={`${sel} ${!e.kelasBaru ? 'border-red-400' : ''}`}>
                                  {!e.kelasBaru && <option value="">-- belum ada rombel --</option>}
                                  {opsiTujuan.map((k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                              ) : <span className="text-xs text-gray-400">{e.aksi === 'lulus' ? 'Lulus (kelas dikosongkan)' : e.aksi === 'tidaklulus' ? `Tetap di ${s.kelas}` : e.kelasBaru ? '' : '— belum ada rombel —'}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="sticky bottom-0 bg-white border-t shadow-lg rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {Object.keys(KL_LABEL_AKSI).map((a) => <span key={a} className={`px-2.5 py-1 rounded-full ${KL_WARNA_AKSI[a]}`}>{KL_LABEL_AKSI[a]}: {hitung[a]}</span>)}
            </div>
            <button onClick={jalankanProses} disabled={proses || !rencana.length || masalah > 0 || !tahunSah} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded font-bold text-sm shadow"><i className="fas fa-check-double mr-1"></i> {proses ? 'Memproses…' : `Proses ${rencana.length} Siswa`}</button>
          </div>
        </>
      )}

      {tab === 'riwayat' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {!riwayatSiap ? <KosongInfo teks="Memuat riwayat…" /> : batch.length === 0 ? <KosongInfo teks="Belum ada proses kenaikan kelas." /> : batch.map((b) => {
            const jumlah = (a) => b.baris.filter((r) => r.aksi === a).length;
            return (
              <div key={b.batch} className="border-b last:border-0">
                <div className="p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-gray-700">Tahun ajaran {b.tahunAjaran} {b.dibatalkan && <span className="ml-2 text-[11px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Dibatalkan</span>}</p>
                    <p className="text-xs text-gray-500">{b.tanggal} · oleh {b.oleh} · {jumlah('naik')} naik, {jumlah('tinggal')} tinggal, {jumlah('lulus')} lulus, {jumlah('tidaklulus')} tidak lulus</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBuka(buka === b.batch ? '' : b.batch)} className="text-blue-600 border border-blue-200 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-50">{buka === b.batch ? 'Tutup rincian' : 'Lihat rincian'}</button>
                    {b.batch === batchTerakhir && <button onClick={() => batalkan(b)} disabled={proses} className="text-red-600 border border-red-200 px-3 py-1 rounded text-xs font-semibold hover:bg-red-50 disabled:opacity-60"><i className="fas fa-undo mr-1"></i>Batalkan proses ini</button>}
                  </div>
                </div>
                {buka === b.batch && (
                  <div className="max-h-80 overflow-y-auto border-t">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 sticky top-0"><tr><th className="p-2">Nama</th><th className="p-2">Dari</th><th className="p-2">Ke</th><th className="p-2">Keputusan</th></tr></thead>
                      <tbody>{b.baris.map((r) => <tr key={r.id} className="border-b"><td className="p-2">{r.nama}</td><td className="p-2">{r.dari}</td><td className="p-2">{r.ke || '—'}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full font-semibold ${KL_WARNA_AKSI[r.aksi] || ''}`}>{KL_LABEL_AKSI[r.aksi] || r.aksi}</span></td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ARSIP BERKAS LULUSAN — KK, Akte, Ijazah, SKL, Rapor (disimpan privat di Google Drive)
// ---------------------------------------------------------------------------
const KL_JENIS = ['KK', 'Akte', 'Ijazah', 'SKL', 'Rapor'];
const KL_JENIS_LABEL = { KK: 'Kartu Keluarga', Akte: 'Akte Kelahiran', Ijazah: 'Ijazah', SKL: 'Surat Ket. Lulus (SKL)', Rapor: 'Rapor' };
const KL_JENIS_IKON = { KK: 'fa-people-roof', Akte: 'fa-baby', Ijazah: 'fa-certificate', SKL: 'fa-file-circle-check', Rapor: 'fa-book' };

const ArsipBerkasLulusan = () => {
  const DB = useDB();
  const lulusanList = useLulusan();
  const kelola = DB.punyaPeran(['admin', 'kepsek']);
  const [proses, jalankan] = useAksi();
  const [berkas, setBerkas] = useState([]);
  const [siap, setSiap] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [cari, setCari] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [siswaBuka, setSiswaBuka] = useState(null);          // nisn yang sedang dikelola
  const [jenisUnggah, setJenisUnggah] = useState('KK');
  const [keterangan, setKeterangan] = useState('');
  const [pratinjau, setPratinjau] = useState(null);

  useEffect(() => {
    apiPanggil('daftarArsip').then((res) => { setBerkas(res.data); setSiap(true); }).catch((e) => { showAlert('Gagal memuat arsip: ' + e.message, 'error'); setSiap(true); });
    if (kelola) apiPanggil('riwayatKelas').then((res) => setRiwayat(res.data)).catch(() => {});
  }, []);

  const tahunLulus = useMemo(() => { const p = {}; riwayat.filter((r) => r.aksi === 'lulus' && !r.dibatalkan).forEach((r) => { p[r.nisn] = r.tahunAjaran; }); return p; }, [riwayat]);
  const semuaSiswa = DB.rows('Siswa');
  const daftar = useMemo(() => lulusanList.map((l) => {
    const s = semuaSiswa.find((x) => x.nisn === l.nisn);
    const label = tahunLulus[l.nisn] ? `Lulus ${tahunLulus[l.nisn]}` : (s && s.status === 'Lulus') ? 'Lulusan terdahulu' : 'Calon lulusan (kelas 6)';
    return { nisn: l.nisn, nama: l.nama, angkatan: label };
  }), [lulusanList, semuaSiswa, tahunLulus]);
  const daftarAngkatan = [...new Set(daftar.map((d) => d.angkatan))].sort().reverse();
  const q = cari.trim().toLowerCase();
  const tampil = daftar.filter((d) => (!angkatan || d.angkatan === angkatan) && (!q || String(d.nama).toLowerCase().includes(q) || String(d.nisn).includes(q)));
  const jumlah = (nisn, jenis) => berkas.filter((b) => b.nisn === nisn && (!jenis || b.jenis === jenis)).length;
  const lengkap = (nisn) => KL_JENIS.every((j) => jumlah(nisn, j) > 0);
  const nLengkap = tampil.filter((d) => lengkap(d.nisn)).length;
  const siswa = daftar.find((d) => d.nisn === siswaBuka) || null;

  const ambilIsi = async (r) => { const res = await apiPanggil('bacaArsip', { id: r.id }); return { ...res.data, blob: klBlob(res.data.base64, res.data.mime) }; };
  const lihat = (r) => jalankan(async () => {
    const d = await ambilIsi(r);
    setPratinjau({ judul: `${KL_JENIS_LABEL[r.jenis] || r.jenis} — ${r.nama}`, mime: d.mime, nama: d.nama, url: URL.createObjectURL(d.blob) });
  });
  const tutupPratinjau = () => { if (pratinjau && pratinjau.url) URL.revokeObjectURL(pratinjau.url); setPratinjau(null); };
  const unduh = (r) => jalankan(async () => {
    const d = await ambilIsi(r);
    const url = URL.createObjectURL(d.blob);
    const a = document.createElement('a'); a.href = url; a.download = d.nama || 'arsip'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
  const hapus = (r) => {
    if (!confirm(`Hapus ${r.jenis} ${r.nama}${r.keterangan ? ' (' + r.keterangan + ')' : ''}? Berkas dipindahkan ke Sampah Google Drive.`)) return;
    jalankan(async () => { await apiPanggil('hapusArsip', { id: r.id }); setBerkas((x) => x.filter((y) => y.id !== r.id)); showAlert('Berkas dihapus.'); });
  };
  const unggah = (e) => {
    const files = Array.from((e.target.files) || []);
    e.target.value = '';
    if (!files.length || !siswa) return;
    jalankan(async () => {
      let ok = 0;
      for (const file of files) {
        try {
          let blob = file, mime = file.type;
          if (mime.startsWith('image/')) { blob = await kecilkanGambar(file, 1600); mime = 'image/jpeg'; }
          else if (mime !== 'application/pdf') throw new Error(`${file.name}: gunakan foto atau PDF.`);
          if (blob.size > 4.8 * 1024 * 1024) throw new Error(`${file.name}: ukuran maksimal 5 MB.`);
          const base64 = await bacaBase64(blob);
          const res = await apiPanggil('unggahArsip', { nisn: siswa.nisn, jenis: jenisUnggah, keterangan, mime, base64 });
          setBerkas((x) => [...x, res.data]); ok++;
        } catch (err) { showAlert(err.message, 'error'); }
      }
      if (ok) { showAlert(`${ok} berkas ${jenisUnggah} berhasil diarsipkan.`); setKeterangan(''); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 items-center justify-between no-print">
        <div>
          <h3 className="font-bold text-gray-700"><i className="fas fa-folder-open text-green-600 mr-1"></i> Arsip Berkas Lulusan</h3>
          <p className="text-xs text-gray-500">Kartu Keluarga, Akte, Ijazah, SKL, dan Rapor. Disimpan privat di Google Drive sekolah; hanya admin/kepala sekolah{kelola ? '' : ' dan orang tua yang bersangkutan'} yang dapat membukanya.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {daftarAngkatan.length > 1 && <select value={angkatan} onChange={(e) => setAngkatan(e.target.value)} className="border p-2 rounded text-sm bg-white"><option value="">Semua angkatan</option>{daftarAngkatan.map((a) => <option key={a}>{a}</option>)}</select>}
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / NISN…" className="border p-2 rounded text-sm" />
        </div>
      </div>

      {!siap ? <KosongInfo teks="Memuat arsip…" /> : daftar.length === 0 ? <KosongInfo teks="Belum ada lulusan atau calon lulusan. Siswa kelas 6 dan siswa berstatus Lulus otomatis muncul di sini." /> : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gray-50 text-xs text-gray-600 flex flex-wrap gap-4">
            <span><b>{tampil.length}</b> siswa</span>
            <span className="text-green-700"><b>{nLengkap}</b> berkas lengkap (kelima jenis)</span>
            <span className="text-orange-600"><b>{tampil.length - nLengkap}</b> belum lengkap</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-xs text-gray-500">
                <tr><th className="p-2.5">Nama</th><th className="p-2.5">Angkatan</th>{KL_JENIS.map((j) => <th key={j} className="p-2.5 text-center">{j}</th>)}<th className="p-2.5 text-center">{kelola ? 'Kelola' : 'Lihat'}</th></tr>
              </thead>
              <tbody>
                {tampil.map((d) => (
                  <tr key={d.nisn} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-2.5"><p className="font-medium">{d.nama}</p><p className="text-[11px] text-gray-400">{d.nisn}</p></td>
                    <td className="p-2.5 text-xs text-gray-600">{d.angkatan}</td>
                    {KL_JENIS.map((j) => {
                      const n = jumlah(d.nisn, j);
                      return <td key={j} className="p-2.5 text-center"><button onClick={() => { setSiswaBuka(d.nisn); setJenisUnggah(j); }} title={`${KL_JENIS_LABEL[j]}: ${n} berkas`} className={`w-8 h-8 rounded-full text-xs font-bold ${n ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{n ? n : '–'}</button></td>;
                    })}
                    <td className="p-2.5 text-center"><button onClick={() => { setSiswaBuka(d.nisn); setJenisUnggah('KK'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold"><i className={`fas ${kelola ? 'fa-upload' : 'fa-eye'} mr-1`}></i>{kelola ? 'Kelola' : 'Lihat'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!siswa} onClose={() => setSiswaBuka(null)} title={siswa ? `Arsip — ${siswa.nama}` : ''} size="max-w-2xl">
        {siswa && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">NISN {siswa.nisn} · {siswa.angkatan}</p>
            {kelola && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-bold text-gray-700"><i className="fas fa-upload mr-1 text-green-600"></i> Unggah berkas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={jenisUnggah} onChange={(e) => setJenisUnggah(e.target.value)} className="border p-2 rounded text-sm bg-white">{KL_JENIS.map((j) => <option key={j} value={j}>{KL_JENIS_LABEL[j]}</option>)}</select>
                  <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} maxLength={100} placeholder="Keterangan (mis. Rapor Kelas 5 Sem 1)" className="border p-2 rounded text-sm" />
                </div>
                <label className={`inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold cursor-pointer ${proses ? 'opacity-60 pointer-events-none' : ''}`}>
                  <i className="fas fa-file-upload mr-1"></i> {proses ? 'Memproses…' : 'Pilih foto / PDF'}
                  <input type="file" accept="image/*,application/pdf" multiple onChange={unggah} disabled={proses} className="hidden" />
                </label>
                <p className="text-[11px] text-gray-500">Foto atau PDF, maksimal 5 MB per berkas. Foto dikecilkan otomatis. Boleh memilih beberapa berkas sekaligus (mis. rapor semua semester).</p>
              </div>
            )}
            {KL_JENIS.map((j) => {
              const isi = berkas.filter((b) => b.nisn === siswa.nisn && b.jenis === j);
              return (
                <div key={j} className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between"><span className="font-bold text-sm text-gray-700"><i className={`fas ${KL_JENIS_IKON[j]} mr-2 text-green-600`}></i>{KL_JENIS_LABEL[j]}</span><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isi.length ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{isi.length ? `${isi.length} berkas` : 'belum ada'}</span></div>
                  {isi.map((b) => (
                    <div key={b.id} className="px-3 py-2 border-b last:border-0 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="min-w-0"><p className="font-medium truncate">{b.keterangan || b.namaFile}</p><p className="text-gray-400">{b.mime === 'application/pdf' ? 'PDF' : 'Foto'} · {klUkuran(b.ukuran)} · {tanggalPanjang(String(b.diunggah).slice(0, 10))}</p></div>
                      <div className="flex gap-1.5">
                        <button onClick={() => lihat(b)} disabled={proses} className="text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-60"><i className="fas fa-eye"></i> Lihat</button>
                        <button onClick={() => unduh(b)} disabled={proses} className="text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-50 disabled:opacity-60"><i className="fas fa-download"></i> Unduh</button>
                        {kelola && <button onClick={() => hapus(b)} disabled={proses} className="text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-60"><i className="fas fa-trash"></i></button>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!pratinjau} onClose={tutupPratinjau} title={pratinjau ? pratinjau.judul : ''} size="max-w-3xl">
        {pratinjau && (pratinjau.mime === 'application/pdf'
          ? <div className="space-y-3"><iframe src={pratinjau.url} title="Pratinjau PDF" className="w-full h-[65vh] border rounded"></iframe><a href={pratinjau.url} download={pratinjau.nama || 'arsip.pdf'} className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-download mr-2"></i>Unduh PDF</a></div>
          : <img src={pratinjau.url} alt={pratinjau.judul} className="w-full rounded border" />)}
      </Modal>
    </div>
  );
};

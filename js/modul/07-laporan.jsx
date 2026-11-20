// ===== Laporan & Kepegawaian: Daftar I dan Absensi Guru =====
// ===== Daftar I — Laporan Bulanan Sekolah (formulir cetak, semua sel dapat diisi) =====
const D1_KELAS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const D1_USIA = [6, 7, 8, 9, 10, 11, 12, 13, 14];
const D1_BARIS = [['lalu', 'Penghabisan bulan lalu'], ['keluar', 'Keluar dalam bulan ini'], ['masuk', 'Masuk dalam bulan ini'], ['akhir', 'Penghabisan bulan ini']];
const D1_ALAT = [['bangku', 'Bangku'], ['mejaMurid', 'Meja Murid'], ['kursiMurid', 'Kursi Murid'], ['lemari', 'Lemari'], ['kursiGuru', 'Meja Guru'], ['papanTulis', 'Papan Tulis'], ['mejaTamu', 'Kursi Tamu'], ['rakBuku', 'Rak Buku']];
const D1_PEMILIK = [['pemerintah', 'Pemerintah'], ['yayasan', 'Yayasan'], ['perseorangan', 'Perseorangan']];

const d1Peta = (kunci, f) => { const o = {}; kunci.forEach((k) => { o[k] = f(k); }); return o; };
const d1LP = () => ({ l: '', p: '' });
const d1Angka = (v) => { const x = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.')); return isNaN(x) ? 0 : x; };
const d1Ambil = (o, jalur) => jalur.reduce((a, k) => (a === undefined || a === null ? undefined : a[k]), o);
const d1Set = (o, jalur, v) => { if (!jalur.length) return v; const h = jalur[0]; return { ...(o || {}), [h]: d1Set(o ? o[h] : undefined, jalur.slice(1), v) }; };
const d1Fmt = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
const d1Gabung = (dasar, simpan) => {
  if (simpan === undefined || simpan === null) return dasar;
  if (typeof dasar !== 'object' || dasar === null || Array.isArray(dasar)) return simpan;
  if (typeof simpan !== 'object') return dasar;
  const o = { ...dasar };
  Object.keys(simpan).forEach((k) => { o[k] = k in dasar ? d1Gabung(dasar[k], simpan[k]) : simpan[k]; });
  return o;
};

const d1Kosong = (sekolah, tahun, bulan) => ({
  tahun, bulan,
  identitas: { coret: { a: true, b: true, c: true, d: true, e: false }, tahunPendirian: '2016', nss: '', npsn: sekolah.npsn || '', nsb: '',
               alamat: 'Dsn Krajan Satu, Sukamerta', desa: 'Rawamerta', kabupaten: 'Karawang / Jawa Barat', akreditasi: 'Terakreditasi thn 2022' },
  usia: d1Peta(D1_KELAS, () => d1Peta(D1_USIA, d1LP)),
  bag: d1Peta(D1_KELAS, () => ''),
  murid: d1Peta(D1_BARIS.map((b) => b[0]), () => ({
    wni: d1Peta(D1_KELAS, d1LP), wna: d1Peta(D1_KELAS, d1LP),
    tambahan: { wni: { kelas: '', bagi: '' }, wna: { kelas: '', bagi: '' } }
  })),
  tanah: d1Peta(D1_PEMILIK.map((p) => p[0]), () => ({ darat: '', persil: '', tahun: '', harga: '' })),
  bangunan: d1Peta(D1_PEMILIK.map((p) => p[0]), () => ({ baikB: '', baikR: '', sedangB: '', sedangR: '', rusakB: '', rusakR: '' })),
  sifat: { permanen: false, semi: false, darurat: false },
  menumpang: '',
  air: { sumur: false, pam: false, sumurPompa: false, pompaAir: false },
  perkakas: d1Peta(D1_ALAT.map((a) => a[0]), () => ({ baik: '', sedang: '', rusak: '' })),
  absensi: { sakit: { orang: '', persen: '' }, izin: { orang: '', persen: '' }, lain: { orang: '', persen: '' } },
  guru: { l: '', p: '' },
  pegawai: { urut: [], data: {} },
  hadir: {},
  ttd: { korwilJabatan: 'Korwilcam Bidik Kec. Rawamerta', korwilNama: 'Dra. POPON EPON', korwilNip: '196609151992022001', kota: 'Rawamerta',
         tanggal: `${new Date(tahun, bulan, 0).getDate()} ${BULAN_ID[bulan - 1]} ${tahun}` }
});

// Penghabisan bulan ini = penghabisan bulan lalu − keluar + masuk (dihitung otomatis)
const d1Akhir = (d, k, bangsa, g) => d1Angka(d.murid.lalu[bangsa][k][g]) - d1Angka(d.murid.keluar[bangsa][k][g]) + d1Angka(d.murid.masuk[bangsa][k][g]);

const PEG_LEBAR = [26, 168, 56, 26, 38, 26, 26, 26, 40, 66, 92, 58, 62, 36, 150, 32, 52, 22, 22, 26, 34];
const d1TglDM = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${m[3]}-${m[2]}-${m[1]}` : String(iso || ''); };
// '6A - Abu Bakar' → 'VI A', 'VI (Enam)' → 'VI'
const d1Rombel = (kelas) => {
  const k = String(kelas || '').trim(); const t = tingkatDariKelas(k); if (!t) return k;
  const m = /^\d+\s*([A-Za-z])(?![A-Za-z])/.exec(k) || /^[IVX]+(?![A-Za-z])\s*([A-Za-z])(?![A-Za-z])/.exec(k);
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][t] + (m ? ' ' + m[1].toUpperCase() : '');
};
const d1PegBaru = (g, wali) => ({
  nama: g ? g.nama : '', ttl: g ? [g.tempatLahir, d1TglDM(g.tglLahir)].filter(Boolean).join(', ') : '', nip: g && g.nip ? g.nip : '-', jk: '', agama: 'Islam',
  kawin: '', anak: '', ijSK: '-', ijAkhir: g ? (g.pendidikan || '') : '', jabatan: '', mkT: '', mkB: '', mulaiPeg: '-', mulaiSekolah: '',
  kelas: wali ? d1Rombel(wali.kelas) : '-', tmt: '', gol: '-', gaji: '-', sakit: '', izin: '', lain: '', ket: '', pangkat: 'GTY/PTY'
});
const d1Hitung = (h) => {
  const c = { s: 0, i: 0, a: 0, j: 0 };
  Object.keys(h || {}).forEach((k) => { const v = String(h[k]).trim(); if (v === 'S') c.s++; else if (v === 'I') c.i++; else if (v === 'A') c.a++; else if (v === '✓' || v === 'D') c.j++; });
  return c;
};
const d1Norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

const DaftarSatu = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const awal = new Date(DB.hariIni + 'T00:00:00');
  const [tahun, setTahun] = useState(awal.getFullYear());
  const [bulan, setBulan] = useState(awal.getMonth() + 1);
  const [d, setD] = useState(() => d1Kosong(sekolah, awal.getFullYear(), awal.getMonth() + 1));
  const [tersimpan, setTersimpan] = useState('');
  const [siap, setSiap] = useState(false);
  const [info, setInfo] = useState('');
  const [proses, jalankan] = useAksi();
  const [tab, setTab] = useState('d1');
  const kotor = siap && JSON.stringify(d) !== tersimpan;
  const periode = (t, b) => `${t}-${String(b).padStart(2, '0')}`;

  const muat = async (t, b) => {
    setSiap(false);
    try {
      const res = await apiPanggil('getDaftarSatu', { periode: periode(t, b) });
      const dasar = d1Kosong(sekolah, t, b);
      const isi = res.data.ada ? d1Gabung(dasar, res.data.data) : dasar;
      isi.tahun = t; isi.bulan = b;
      setD(isi); setTersimpan(JSON.stringify(isi));
      setInfo(res.data.ada ? `Terakhir disimpan ${res.data.diperbarui} oleh ${res.data.oleh}` : 'Belum ada data untuk bulan ini. Isi manual, atau gunakan tombol Isi Otomatis / Salin Bulan Lalu.');
    } catch (e) { showAlert('Gagal memuat Daftar I: ' + e.message, 'error'); }
    setSiap(true);
  };
  useEffect(() => { muat(tahun, bulan); }, []);

  const pindah = (t, b) => {
    if (kotor && !confirm('Perubahan yang belum disimpan akan hilang. Lanjutkan?')) return;
    setTahun(t); setBulan(b); muat(t, b);
  };

  const simpan = () => jalankan(async () => {
    const res = await apiPanggil('saveDaftarSatu', { periode: periode(tahun, bulan), data: d });
    setTersimpan(JSON.stringify(d));
    setInfo('Tersimpan ' + res.data.diperbarui);
    showAlert(res.message);
  });

  const isiOtomatis = () => jalankan(async () => {
    const res = await apiPanggil('hitungDaftarSatu', { tahun, bulan });
    const s = res.data;
    const t = (n) => (n ? String(n) : '');
    setD((x) => {
      const y = JSON.parse(JSON.stringify(x));
      const laluKosong = D1_KELAS.every((k) => ['l', 'p'].every((g) => y.murid.lalu.wni[k][g] === ''));
      D1_KELAS.forEach((k) => {
        if (s.bag[k]) y.bag[k] = String(s.bag[k]);
        ['l', 'p'].forEach((g) => {
          y.murid.masuk.wni[k][g] = t(s.masuk[k][g]);
          if (laluKosong) y.murid.lalu.wni[k][g] = t(s.akhir[k][g] - s.masuk[k][g] + d1Angka(y.murid.keluar.wni[k][g]));
          D1_USIA.forEach((u) => { y.usia[k][u][g] = t(s.usia[k][u][g]); });
        });
      });
      ['sakit', 'izin', 'lain'].forEach((c) => { y.absensi[c].orang = String(s.absensi[c].orang); y.absensi[c].persen = String(s.absensi[c].persen); });
      const jk = (c) => y.pegawai.urut.filter((id) => String(y.pegawai.data[id].jk).toUpperCase().startsWith(c)).length;
      if (jk('L') + jk('P')) { y.guru.l = String(jk('L')); y.guru.p = String(jk('P')); }
      return y;
    });
    showAlert('Angka diisi dari Data Siswa & Absensi. Periksa kembali sebelum disimpan.' + (s.catatan.length ? ' Catatan: ' + s.catatan.join(' ') : ''), s.catatan.length ? 'info' : 'sukses');
  });

  const salinBulanLalu = () => jalankan(async () => {
    const pb = bulan === 1 ? 12 : bulan - 1, pt = bulan === 1 ? tahun - 1 : tahun;
    const res = await apiPanggil('getDaftarSatu', { periode: periode(pt, pb) });
    if (!res.data.ada) return showAlert(`Daftar I ${BULAN_ID[pb - 1]} ${pt} belum ada.`, 'error');
    if (!confirm('Isi formulir bulan ini akan diganti dengan data tetap bulan lalu (identitas, tanah, bangunan, perkakas, guru, data pegawai) dan penghabisan bulan lalu. Lanjutkan?')) return;
    const prev = d1Gabung(d1Kosong(sekolah, pt, pb), res.data.data);
    const y = d1Kosong(sekolah, tahun, bulan);
    ['identitas', 'bag', 'tanah', 'bangunan', 'sifat', 'menumpang', 'air', 'perkakas', 'guru'].forEach((k) => { y[k] = JSON.parse(JSON.stringify(prev[k])); });
    ['wni', 'wna'].forEach((b) => D1_KELAS.forEach((k) => ['l', 'p'].forEach((g) => { const n = d1Akhir(prev, k, b, g); y.murid.lalu[b][k][g] = n ? String(n) : ''; })));
    y.pegawai = JSON.parse(JSON.stringify(prev.pegawai));
    Object.keys(y.pegawai.data).forEach((id) => { ['sakit', 'izin', 'lain'].forEach((f) => { y.pegawai.data[id][f] = ''; }); });
    y.ttd = { ...prev.ttd, tanggal: y.ttd.tanggal };
    setD(y);
    showAlert('Data bulan lalu disalin. Lengkapi bagian bulan ini lalu simpan.');
  });

  const isiPegawai = () => jalankan(async () => {
    const guru = DB.rows('Guru'), rombel = DB.rows('Rombel');
    const y = JSON.parse(JSON.stringify(d)); let tambah = 0;
    guru.forEach((g) => {
      const id = 'g' + g.id;
      if (y.pegawai.data[id]) return;
      const wali = rombel.filter((r) => d1Norm(r.wali) === d1Norm(g.nama) && d1Norm(g.nama))[0];
      y.pegawai.data[id] = d1PegBaru(g, wali); y.pegawai.urut.push(id); tambah++;
    });
    setD(y);
    showAlert(tambah ? `${tambah} guru ditambahkan dari Data Guru. Lengkapi kolom lain (L/P, jabatan, masa kerja, dst.) langsung di tabel.` : 'Semua guru di Data Guru sudah ada di tabel ini.', tambah ? 'sukses' : 'info');
  });

  const isiHadir = () => jalankan(async () => {
    if (!d.pegawai.urut.length) return showAlert('Isi dulu tab Data Pegawai (tombol Isi dari Data Guru).', 'error');
    const res = await apiPanggil('list', { tabel: 'Absensi_Guru' });
    const awalP = periode(tahun, bulan), KODE = { Hadir: '✓', Izin: 'I', Sakit: 'S', 'Dinas Luar': 'D', Alpha: 'A' };
    const y = JSON.parse(JSON.stringify(d)), idNama = {}, tak = {};
    y.pegawai.urut.forEach((id) => { idNama[d1Norm(y.pegawai.data[id].nama)] = id; y.hadir[id] = {}; });
    let n = 0;
    (res.data || []).filter((r) => String(r.tanggal).indexOf(awalP) === 0).forEach((r) => {
      const id = idNama[d1Norm(r.guru)];
      if (!id) { tak[r.guru] = true; return; }
      y.hadir[id][String(parseInt(String(r.tanggal).slice(8, 10), 10))] = KODE[r.statusHari] || '✓'; n++;
    });
    y.pegawai.urut.forEach((id) => { const c = d1Hitung(y.hadir[id]); const p = y.pegawai.data[id]; p.sakit = c.s ? String(c.s) : ''; p.izin = c.i ? String(c.i) : ''; p.lain = c.a ? String(c.a) : ''; });
    setD(y);
    const asing = Object.keys(tak);
    showAlert(`${n} catatan absensi guru dimasukkan.` + (asing.length ? ` Tidak cocok dengan nama di Data Pegawai: ${asing.join(', ')}.` : '') + ' Hari libur/izin lain bisa diketik langsung.', asing.length ? 'info' : 'sukses');
  });

  const isiTab = () => (tab === 'peg' ? isiPegawai() : tab === 'hadir' ? isiHadir() : isiOtomatis());
  const tambahPeg = () => setD((x) => { const id = 'x' + Date.now(); const y = JSON.parse(JSON.stringify(x)); y.pegawai.data[id] = d1PegBaru(null, null); y.pegawai.urut.push(id); return y; });
  const hapusPeg = (id) => {
    if (!confirm('Hapus baris pegawai ini dari Daftar I bulan ini? (Data Guru tidak terhapus)')) return;
    setD((x) => { const y = JSON.parse(JSON.stringify(x)); y.pegawai.urut = y.pegawai.urut.filter((i) => i !== id); delete y.pegawai.data[id]; delete y.hadir[id]; return y; });
  };

  // ---- pembuat sel (fungsi biasa, bukan komponen, agar kursor tidak hilang saat mengetik) ----
  const inp = (jalur, angka = true, cls = '') => (
    <input className={cls} inputMode={angka ? 'decimal' : 'text'} value={d1Ambil(d, jalur) === undefined ? '' : d1Ambil(d, jalur)}
      onChange={(e) => { const v = angka ? e.target.value.replace(/[^0-9.,]/g, '') : e.target.value; setD((x) => d1Set(x, jalur, v)); }} />
  );
  const lp = (jalur) => <div className="lp">{inp([...jalur, 'l'])}<span>/</span>{inp([...jalur, 'p'])}</div>;
  const tog = (jalur, label) => (
    <button type="button" className={`toggle ${d1Ambil(d, jalur) ? 'coret' : ''}`} title="Klik untuk mencoret / membatalkan coretan"
      onClick={() => setD((x) => d1Set(x, jalur, !d1Ambil(x, jalur)))}>{label}</button>
  );

  // ---- perhitungan ----
  const sumUsiaKelas = (k, g) => D1_USIA.reduce((t, u) => t + d1Angka(d.usia[k][u][g]), 0);
  const sumUsiaUsia = (u, g) => D1_KELAS.reduce((t, k) => t + d1Angka(d.usia[k][u][g]), 0);
  const totalUsia = (g) => D1_KELAS.reduce((t, k) => t + sumUsiaKelas(k, g), 0);
  const nilaiMurid = (kb, b, k, g) => (kb === 'akhir' ? d1Akhir(d, k, b, g) : d1Angka(d.murid[kb][b][k][g]));
  const sumBaris = (kb, b, g) => D1_KELAS.reduce((t, k) => t + nilaiMurid(kb, b, k, g), 0);
  const totalKelas = (k) => ['wni', 'wna'].reduce((t, b) => t + d1Akhir(d, k, b, 'l') + d1Akhir(d, k, b, 'p'), 0);
  const totalSemua = D1_KELAS.reduce((t, k) => t + totalKelas(k), 0);
  const totalBag = D1_KELAS.reduce((t, k) => t + d1Angka(d.bag[k]), 0);
  const sumTanah = (f) => D1_PEMILIK.reduce((t, p) => t + d1Angka(d.tanah[p[0]][f]), 0);
  const sumBgn = (f) => D1_PEMILIK.reduce((t, p) => t + d1Angka(d.bangunan[p[0]][f]), 0);
  const jumlahBgn = (p, tipe) => ['baik', 'sedang', 'rusak'].reduce((t, s) => t + d1Angka(d.bangunan[p][s + tipe]), 0);
  const jumlahAlat = (a) => ['baik', 'sedang', 'rusak'].reduce((t, s) => t + d1Angka(d.perkakas[a][s]), 0);
  const ttdBlok = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 70px 0', fontSize: 11 }}>
      <div style={{ textAlign: 'center', width: 290 }}>
        <div>Mengetahui :</div>
        <div>{inp(['ttd', 'korwilJabatan'], false)}</div>
        <div style={{ height: 62 }}></div>
        <div style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{inp(['ttd', 'korwilNama'], false, 'bold')}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}><span>NIP.</span>{inp(['ttd', 'korwilNip'], false, 'w150')}</div>
      </div>
      <div style={{ textAlign: 'center', width: 290 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>{inp(['ttd', 'kota'], false, 'w90 kanan')}<span>,</span>{inp(['ttd', 'tanggal'], false, 'w130')}</div>
        <div>Kepala Sekolah,</div>
        <div style={{ height: 62 }}></div>
        <div style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{sekolah.kepsek}</div>
        <div>NIP. {sekolah.nipKepsek || '-'}</div>
      </div>
    </div>
  );
  const rupiah = (n) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <div className="space-y-4">
      <style>{`
        @page { size: A4 landscape; margin: 6mm; }
        .d1 { font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.2; color: #000; width: 1122px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .d1 table { border-collapse: collapse; table-layout: fixed; width: 100%; }
        .d1 td, .d1 th { border: 1px solid #000; padding: 0 2px; height: 20px; text-align: center; vertical-align: middle; font-weight: normal; overflow: hidden; }
        .d1 th { font-weight: bold; }
        .d1 .tb { margin: -1px 0 0 -1px; width: calc(100% + 1px); }
        .d1 input { width: 100%; min-width: 0; border: 0; background: transparent; text-align: center; font: inherit; padding: 1px 0; color: #000; }
        .d1 input:focus { outline: 2px solid #16a34a; background: #fff; position: relative; z-index: 1; }
        .d1 .il { text-align: left; width: 70%; border-bottom: 1px dotted #000; }
        .d1 .kiri { text-align: left; padding-left: 4px; }
        .d1 .biru { background: #cfe2f3; } .d1 .kuning { background: #ffffc0; } .d1 .judul { background: #ffff99; } .d1 .abu { background: #efefef; }
        .d1 .bold { font-weight: bold; }
        .d1 .lp { display: flex; align-items: center; justify-content: center; } .d1 .lp span { padding: 0 1px; }
        .d1 .bag { display: flex; align-items: center; justify-content: center; font-size: 12px; } .d1 .bag input { width: 24px; font-size: 14px; }
        .d1 .vert { writing-mode: vertical-rl; transform: rotate(180deg); margin: auto; white-space: nowrap; }
        .d1 .toggle { cursor: pointer; background: none; border: 0; font: inherit; padding: 0 1px; color: #000; }
        .d1 .toggle.coret { text-decoration: line-through; color: #444; }
        .d1 .besar { font-size: 22px; font-weight: bold; color: #1d4ed8; }
        .d1 .aqua { background: #ccffff; }
        .d1 .vert3 { line-height: 1.15; font-size: 9px; font-weight: bold; }
        .d1 .vertw { writing-mode: vertical-rl; transform: rotate(180deg); margin: auto; max-height: 104px; white-space: normal; font-size: 8.5px; line-height: 1.1; font-weight: bold; }
        .d1 .nb td { border: 0; }
        .d1 .w22 { width: 24px; } .d1 .w90 { width: 90px; } .d1 .w130 { width: 130px; } .d1 .w150 { width: 150px; } .d1 .kanan { text-align: right; }
        .d1 .il2 { text-align: left; }
        .d1.pg td, .d1.pg th { font-size: 9px; } .d1.pg input { font-size: 9px; }
        .d1 .hc { font-size: 10px; font-weight: bold; padding: 0; }
        .d1 td.rel { position: relative; } .d1 .x { position: absolute; left: 0; top: 0; width: 12px; height: 12px; line-height: 10px; font-size: 11px; color: #dc2626; background: #fff; border: 0; cursor: pointer; opacity: 0; }
        .d1 td.rel:hover .x { opacity: 1; }
        @media print {
          #daftar1-area, #daftar1-area *, #peg-area, #peg-area *, #hadir-area, #hadir-area * { visibility: visible; }
          #peg-area, #hadir-area { position: absolute; left: 0; top: 0; transform: scale(0.95); transform-origin: top left; box-shadow: none !important; }
          #daftar1-area { position: absolute; left: 0; top: 0; transform: scale(0.95); transform-origin: top left; box-shadow: none !important; }
          .d1 input:focus { outline: none; }
        }
      `}</style>

      <div className="flex gap-1 no-print border-b border-gray-300">
        {[['d1', 'Daftar 1', 'fa-file-alt'], ['peg', 'Data Pegawai', 'fa-id-card'], ['hadir', 'Daftar Hadir', 'fa-clipboard-check']].map(([k, label, ikon]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-bold rounded-t-lg border border-b-0 ${tab === k ? 'bg-white text-green-700 border-gray-300' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}><i className={`fas ${ikon} mr-2`}></i>{label}</button>
        ))}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-gray-700 mr-2"><i className="fas fa-file-alt text-green-600"></i> Daftar I</h3>
          <select value={bulan} onChange={(e) => pindah(tahun, Number(e.target.value))} className="border p-2 rounded text-sm bg-white font-semibold">
            {BULAN_ID.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
          </select>
          <input type="number" value={tahun} min="2000" max="2100" onChange={(e) => { const t = Number(e.target.value); if (t >= 2000 && t <= 2100) pindah(t, bulan); }} className="border p-2 rounded text-sm w-24 font-semibold" />
          {kotor && <span className="text-xs font-semibold text-orange-600"><i className="fas fa-circle text-[8px] mr-1"></i>Belum disimpan</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={salinBulanLalu} disabled={proses || !siap} className="bg-gray-600 hover:bg-gray-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-copy mr-1"></i> Salin Bulan Lalu</button>
          <button onClick={isiTab} disabled={proses || !siap} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-magic mr-1"></i> {tab === 'peg' ? 'Isi dari Data Guru' : tab === 'hadir' ? 'Isi dari Absensi Guru' : 'Isi Otomatis dari Data'}</button>
          <button onClick={simpan} disabled={proses || !siap} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-save mr-1"></i> Simpan</button>
          <button onClick={() => window.print()} disabled={!siap} className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-print mr-1"></i> Cetak / PDF</button>
        </div>
        <p className="w-full text-[11px] text-gray-500">{siap ? info : 'Memuat…'} · Klik sel mana pun untuk mengisi. Kolom abu-abu/biru dan jumlah dihitung otomatis. Klik tulisan pilihan (Negeri biasa, Permanen, dst.) untuk mencoret.</p>
      </div>

      {tab === 'd1' && (<div className="overflow-x-auto bg-gray-300 p-3 rounded-lg">
        <div id="daftar1-area" className="d1 mx-auto shadow-xl" style={{ opacity: siap ? 1 : 0.5, border: '3px solid #000', boxSizing: 'border-box' }}>
          {/* ===== BARIS ATAS: judul + identitas | A. USIA ANAK ===== */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 600 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
                <div className="judul" style={{ width: 80, border: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px' }}>
                  <div style={{ fontSize: 11 }}>DAFTAR I<br />BULAN</div>
                  <div style={{ fontSize: 13 }}>{BULAN_ID[bulan - 1]}</div>
                  <div style={{ fontSize: 17 }}>{tahun}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <table className="tb" style={{ height: '100%' }}>
                    <colgroup><col style={{ width: 190 }} /><col style={{ width: 132 }} /><col style={{ width: 8 }} /><col /></colgroup>
                    <tbody>
                      <tr><td colSpan="4" style={{ fontSize: 18, fontWeight: 'bold', height: 30 }}>{String(sekolah.namaSekolah || '').toUpperCase()}</td></tr>
                      <tr className="aqua"><td className="kiri">Status *)</td><td className="kiri">Tahun Pendirian SD</td><td>:</td><td>{inp(['identitas', 'tahunPendirian'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">a. {tog(['identitas', 'coret', 'a'], 'Negeri biasa')}</td><td className="kiri">N.S.S</td><td>:</td><td>{inp(['identitas', 'nss'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">b. {tog(['identitas', 'coret', 'b'], 'Negeri Inpres')}</td><td className="kiri">NPSN</td><td>:</td><td>{inp(['identitas', 'npsn'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">c. {tog(['identitas', 'coret', 'c'], 'Subsidi')}</td><td className="kiri">NSB 1 / NSB 2</td><td>:</td><td>{inp(['identitas', 'nsb'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">d. {tog(['identitas', 'coret', 'd'], 'Bantuan')}</td><td className="kiri">Alamat</td><td>:</td><td>{inp(['identitas', 'alamat'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">e. {tog(['identitas', 'coret', 'e'], 'Swasta Penuh')}</td><td className="kiri">Desa/Kelurahan/Kecamatan</td><td>:</td><td>{inp(['identitas', 'desa'], false)}</td></tr>
                      <tr className="aqua"><td className="kiri">f. {inp(['identitas', 'akreditasi'], false, 'il')}</td><td className="kiri">Kabupaten/Kota Madya/Propinsi</td><td>:</td><td>{inp(['identitas', 'kabupaten'], false)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ width: 522 }}>
              <table className="tb">
                <colgroup><col style={{ width: 52 }} />{D1_USIA.map((u) => <col key={u} style={{ width: 44 }} />)}<col style={{ width: 74 }} /></colgroup>
                <thead><tr><th className="kiri biru">A. USIA ANAK</th>{D1_USIA.map((u) => <th key={u} className="biru">{u} TH</th>)}<th className="biru">JUMLAH</th></tr></thead>
                <tbody>
                  {D1_KELAS.map((k) => (
                    <tr key={k}>
                      <td className="kiri">Kelas {k}</td>
                      {D1_USIA.map((u) => <td key={u}>{lp(['usia', k, u])}</td>)}
                      <td className="abu bold">{`${d1Fmt(sumUsiaKelas(k, 'l'))}/${d1Fmt(sumUsiaKelas(k, 'p'))} = ${d1Fmt(sumUsiaKelas(k, 'l') + sumUsiaKelas(k, 'p'))}`}</td>
                    </tr>
                  ))}
                  <tr className="kuning bold">
                    <td className="kiri">Jumlah</td>
                    {D1_USIA.map((u) => <td key={u}>{`${d1Fmt(sumUsiaUsia(u, 'l'))}/${d1Fmt(sumUsiaUsia(u, 'p'))}`}</td>)}
                    <td>{`${d1Fmt(totalUsia('l'))}/${d1Fmt(totalUsia('p'))} = ${d1Fmt(totalUsia('l') + totalUsia('p'))}`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== BARIS BAWAH: BANYAK MURID | B–I ===== */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 600 }}>
              <table className="tb" style={{ height: '100%' }}>
                <colgroup><col style={{ width: 92 }} />{Array.from({ length: 14 }).map((_, i) => <col key={i} style={{ width: 28 }} />)}<col style={{ width: 48 }} /><col style={{ width: 60 }} /></colgroup>
                <thead>
                  <tr>
                    <th rowSpan="4" className="kiri">KETERANGAN</th>
                    <th colSpan="14">B A N Y A K &nbsp; M U R I D</th>
                    <th rowSpan="4"><div className="vert">Jumlah Semua</div></th>
                    <th rowSpan="4"><div className="vert vert3">Jumlah<br />Siswa Kelas<br />Pembangunan</div></th>
                  </tr>
                  <tr>{D1_KELAS.map((k) => <th key={k} colSpan="2">{k}</th>)}<th colSpan="2">Jumlah</th></tr>
                  <tr>
                    {D1_KELAS.map((k) => <td key={k} colSpan="2"><div className="bag">{inp(['bag', k])}<span>bag</span></div></td>)}
                    <td colSpan="2" className="abu"><div className="bag"><b style={{ fontSize: 14 }}>{d1Fmt(totalBag)}</b><span>&nbsp;bag</span></div></td>
                  </tr>
                  <tr>{[...D1_KELAS, 'J'].map((k) => <React.Fragment key={k}><th>L</th><th>P</th></React.Fragment>)}</tr>
                </thead>
                <tbody>
                  {D1_BARIS.map(([kb, label]) => ['wni', 'wna'].map((b) => (
                    <tr key={kb + b}>
                      <td className={`kiri ${b === 'wni' ? 'kuning' : ''}`} style={{ fontSize: 9 }}>{b === 'wni' ? <>{label}<br />Bangsa Indonesia</> : 'Bangsa Asing'}</td>
                      {D1_KELAS.map((k) => ['l', 'p'].map((g) => (
                        kb === 'akhir'
                          ? <td key={k + g} className="abu">{d1Fmt(d1Akhir(d, k, b, g))}</td>
                          : <td key={k + g} className={b === 'wni' ? 'kuning' : ''}>{inp(['murid', kb, b, k, g])}</td>
                      )))}
                      <td className="abu bold">{d1Fmt(sumBaris(kb, b, 'l'))}</td><td className="abu bold">{d1Fmt(sumBaris(kb, b, 'p'))}</td>
                      <td className="abu bold">{d1Fmt(sumBaris(kb, b, 'l') + sumBaris(kb, b, 'p'))}</td>
                      <td>{inp(['murid', kb, 'tambahan', b, 'kelas'], false)}</td>
                    </tr>
                  )))}
                  <tr>
                    <td className="kiri bold" style={{ fontSize: 9, height: 38 }}>Jumlah pada penghabisan bulan ini</td>
                    {D1_KELAS.map((k) => <td key={k} colSpan="2" className="biru bold">{d1Fmt(totalKelas(k))}</td>)}
                    <td colSpan="2" className="biru bold">{d1Fmt(totalSemua)}</td>
                    <td colSpan="2" className="besar">{d1Fmt(totalSemua)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ width: 522 }}>
              {/* B. TANAH */}
              <table className="tb">
                <colgroup><col style={{ width: 110 }} /><col style={{ width: 100 }} /><col style={{ width: 90 }} /><col style={{ width: 90 }} /><col style={{ width: 132 }} /></colgroup>
                <thead>
                  <tr><th rowSpan="2" className="kiri biru">B. TANAH</th><th colSpan="2" className="biru">Luasnya M2</th><th className="biru">Tahun</th><th rowSpan="2" className="biru">Harga</th></tr>
                  <tr><th className="biru">Darat/Sawah</th><th className="biru">No. Persil</th><th className="biru">Pembelian</th></tr>
                </thead>
                <tbody>
                  {D1_PEMILIK.map(([p, label]) => (
                    <tr key={p}><td className="kiri">{label}</td><td>{inp(['tanah', p, 'darat'])}</td><td>{inp(['tanah', p, 'persil'], false)}</td><td>{inp(['tanah', p, 'tahun'], false)}</td><td>{inp(['tanah', p, 'harga'])}</td></tr>
                  ))}
                  <tr className="kuning bold"><td className="kiri">JUMLAH</td><td>{d1Fmt(sumTanah('darat'))}</td><td></td><td></td><td>{rupiah(sumTanah('harga'))}</td></tr>
                </tbody>
              </table>

              {/* C. BANGUNAN */}
              <table className="tb">
                <colgroup><col style={{ width: 114 }} />{Array.from({ length: 8 }).map((_, i) => <col key={i} style={{ width: 51 }} />)}</colgroup>
                <thead>
                  <tr><th rowSpan="2" className="kiri biru">C. BANGUNAN/<br />RUANGAN</th><th colSpan="2" className="biru">Baik</th><th colSpan="2" className="biru">Sedang</th><th colSpan="2" className="biru">Rusak</th><th colSpan="2" className="biru">Jumlah</th></tr>
                  <tr>{[0, 1, 2, 3].map((i) => <React.Fragment key={i}><th>Bgn</th><th>Rgn</th></React.Fragment>)}</tr>
                </thead>
                <tbody>
                  {D1_PEMILIK.map(([p, label]) => (
                    <tr key={p}>
                      <td className="kiri">{label}</td>
                      {['baik', 'sedang', 'rusak'].map((s) => <React.Fragment key={s}><td>{inp(['bangunan', p, s + 'B'])}</td><td>{inp(['bangunan', p, s + 'R'])}</td></React.Fragment>)}
                      <td className="abu bold">{d1Fmt(jumlahBgn(p, 'B'))}</td><td className="abu bold">{d1Fmt(jumlahBgn(p, 'R'))}</td>
                    </tr>
                  ))}
                  <tr className="kuning bold">
                    <td className="kiri">Jumlah</td>
                    {['baik', 'sedang', 'rusak'].map((s) => <React.Fragment key={s}><td>{d1Fmt(sumBgn(s + 'B'))}</td><td>{d1Fmt(sumBgn(s + 'R'))}</td></React.Fragment>)}
                    <td>{d1Fmt(['baik', 'sedang', 'rusak'].reduce((t, s) => t + sumBgn(s + 'B'), 0))}</td><td>{d1Fmt(['baik', 'sedang', 'rusak'].reduce((t, s) => t + sumBgn(s + 'R'), 0))}</td>
                  </tr>
                </tbody>
              </table>

              {/* D, E, F */}
              <table className="tb nb">
                <tbody>
                  <tr><td className="kiri">D. SIFAT BANGUNAN : {tog(['sifat', 'permanen'], 'Permanen')}, {tog(['sifat', 'semi'], 'Semi Permanen')}, {tog(['sifat', 'darurat'], 'Darurat')}</td></tr>
                  <tr><td className="kiri">E. MENUMPANG DI SD : {inp(['menumpang'], false, 'il')}</td></tr>
                  <tr><td className="kiri">F. PENYEDIAAN AIR BERSIH : {tog(['air', 'sumur'], 'Sumur')} / {tog(['air', 'pam'], 'PAM')} / {tog(['air', 'sumurPompa'], 'Sumur Pompa')} / {tog(['air', 'pompaAir'], 'Pompa Air')}</td></tr>
                </tbody>
              </table>

              {/* G. PERKAKAS */}
              <table className="tb">
                <colgroup><col style={{ width: 114 }} /><col style={{ width: 102 }} /><col style={{ width: 102 }} /><col style={{ width: 102 }} /><col style={{ width: 102 }} /></colgroup>
                <thead><tr><th className="kiri biru">G. PERKAKAS</th><th className="biru">Baik</th><th className="biru">Sedang</th><th className="biru">Rusak</th><th className="biru">Jumlah</th></tr></thead>
                <tbody>
                  {D1_ALAT.map(([a, label]) => (
                    <tr key={a}><td className="kiri">{label}</td><td>{inp(['perkakas', a, 'baik'])}</td><td>{inp(['perkakas', a, 'sedang'])}</td><td>{inp(['perkakas', a, 'rusak'])}</td><td className="abu bold">{d1Fmt(jumlahAlat(a))}</td></tr>
                  ))}
                </tbody>
              </table>

              {/* H. ABSENSI MURID — Sakit / Izin / Lain-lain = ... Orang (berbingkai) */}
              <table className="tb">
                <colgroup><col style={{ width: 114 }} /><col style={{ width: 118 }} /><col style={{ width: 40 }} /><col style={{ width: 130 }} /><col /></colgroup>
                <tbody>
                  {[['sakit', 'Sakit', 'H. ABSENSI MURID'], ['izin', 'Izin', 'Orang'], ['lain', 'Lain-lain', '%']].map(([c, label, kiri], i) => (
                    <tr key={c}>
                      <td className={`kiri ${i === 0 ? 'bold' : ''}`}>{kiri}</td>
                      <td className="kiri">{label}</td>
                      <td>=</td>
                      <td>{inp(['absensi', c, 'orang'])}</td>
                      <td className="kiri">Orang</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* I. JUMLAH GURU */}
              <table className="tb nb">
                <colgroup><col style={{ width: 114 }} /><col style={{ width: 130 }} /><col style={{ width: 130 }} /><col /></colgroup>
                <tbody>
                  <tr>
                    <td className="kiri bold">I. Jumlah Guru</td>
                    <td><div className="lp"><span>L =</span>{inp(['guru', 'l'])}</div></td>
                    <td><div className="lp"><span>P =</span>{inp(['guru', 'p'])}</div></td>
                    <td className="abu bold">Jumlah = {d1Fmt(d1Angka(d.guru.l) + d1Angka(d.guru.p))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>)}

      {tab === 'peg' && (
        <div className="overflow-x-auto bg-gray-300 p-3 rounded-lg">
          <div id="peg-area" className="d1 pg mx-auto shadow-xl" style={{ opacity: siap ? 1 : 0.5, padding: '8px 0 14px' }}>
            <div style={{ textAlign: 'center', fontSize: 13, letterSpacing: 5, fontWeight: 'bold', marginBottom: 6 }}>P E G A W A I</div>
            <table className="tb">
              <colgroup>{PEG_LEBAR.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
              <thead>
                <tr style={{ height: 112 }}>
                  <th rowSpan="2" className="kuning"><div className="vertw">NO URUT</div></th>
                  <th rowSpan="2" className="kuning kiri">NAMA /TEMPAT<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TGL LAHIR</th>
                  <th rowSpan="2" className="kuning">NIP/KARPEG</th>
                  <th rowSpan="2" className="kuning">L/P</th>
                  <th rowSpan="2" className="kuning"><div className="vertw">AGAMA</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Kawin/Tdk Kawin</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Anak dibawah Umur 18 Tahun</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Ijazah pada SK Angkatan</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Ijazah terakhir</div></th>
                  <th rowSpan="2" className="kuning">Jabatan</th>
                  <th rowSpan="2" className="kuning">Masa Kerja Seluruhnya yang dihitung dari TMT Angkatan</th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Mulai Jadi Pegawai</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Mulai Bekerja di Sekolah ini</div></th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Mengajar di Kelas</div></th>
                  <th rowSpan="2" className="kuning">TMT Pangkat Terakhir</th>
                  <th colSpan="2" className="kuning">Gaji Pokok</th>
                  <th colSpan="3" className="kuning">Absensi Guru</th>
                  <th rowSpan="2" className="kuning"><div className="vertw">Keterangan</div></th>
                </tr>
                <tr style={{ height: 62 }}>
                  <th className="kuning"><div className="vertw">Gol/Ruang</div></th><th className="kuning">Rp.</th>
                  <th className="kuning"><div className="vertw">Sakit</div></th><th className="kuning"><div className="vertw">Izin</div></th><th className="kuning"><div className="vertw">Lain-lain</div></th>
                </tr>
              </thead>
              <tbody>
                {d.pegawai.urut.length === 0 && <tr><td colSpan="21" style={{ height: 60 }}>Belum ada pegawai. Klik <b>Isi dari Data Guru</b> atau <b>Tambah Baris</b>.</td></tr>}
                {d.pegawai.urut.map((id, i) => {
                  const j = ['pegawai', 'data', id];
                  const c = (f, cls) => inp([...j, f], false, cls || '');
                  return (
                    <tr key={id} style={{ height: 32 }}>
                      <td className="rel">{i + 1}<button type="button" className="x no-print" title="Hapus baris" onClick={() => hapusPeg(id)}>×</button></td>
                      <td className="kiri">{c('nama', 'il2 bold')}{c('ttl', 'il2')}</td>
                      <td>{c('nip')}</td><td>{c('jk')}</td><td>{c('agama')}</td><td>{c('kawin')}</td><td>{inp([...j, 'anak'])}</td><td>{c('ijSK')}</td><td>{c('ijAkhir')}</td><td>{c('jabatan')}</td>
                      <td><div className="lp">{inp([...j, 'mkT'], true, 'w22')}<span>: Tahun</span></div><div className="lp">{inp([...j, 'mkB'], true, 'w22')}<span>: Bulan</span></div></td>
                      <td>{c('mulaiPeg')}</td><td>{c('mulaiSekolah')}</td><td>{c('kelas')}</td><td>{c('tmt')}</td><td>{c('gol')}</td><td>{c('gaji')}</td>
                      <td>{inp([...j, 'sakit'])}</td><td>{inp([...j, 'izin'])}</td><td>{inp([...j, 'lain'])}</td><td>{c('ket')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ttdBlok()}
            <div className="no-print" style={{ padding: '10px 8px 0' }}><button type="button" onClick={tambahPeg} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-bold"><i className="fas fa-plus mr-1"></i> Tambah Baris</button></div>
          </div>
        </div>
      )}

      {tab === 'hadir' && (
        <div className="overflow-x-auto bg-gray-300 p-3 rounded-lg">
          <div id="hadir-area" className="d1 pg mx-auto shadow-xl" style={{ opacity: siap ? 1 : 0.5, padding: '8px 0 14px' }}>
            <div style={{ textAlign: 'center', fontSize: 13, letterSpacing: 5, fontWeight: 'bold', marginBottom: 6 }}>P E G A W A I</div>
            <table className="tb">
              <colgroup><col style={{ width: 24 }} /><col style={{ width: 196 }} /><col style={{ width: 66 }} /><col style={{ width: 48 }} />{Array.from({ length: 35 }).map((_, i) => <col key={i} style={{ width: 22 }} />)}</colgroup>
              <thead>
                <tr style={{ height: 22 }}>
                  <th rowSpan="2" className="kuning"><div className="vertw">NO</div></th>
                  <th rowSpan="2" className="kuning">NAMA PEGAWAI/GURU</th>
                  <th rowSpan="2" className="kuning">PANGKAT<br />GOL/RUANG</th>
                  <th rowSpan="2" className="kuning">GURU<br />KELAS</th>
                  <th colSpan="31" className="kuning" style={{ letterSpacing: 8, fontSize: 11, fontWeight: 'normal' }}>T A N G G A L</th>
                  <th colSpan="4" className="kuning" style={{ fontSize: 10, fontWeight: 'normal' }}>KEHADIRAN</th>
                </tr>
                <tr style={{ height: 20 }}>
                  {Array.from({ length: 31 }).map((_, i) => <th key={i} className="kuning" style={{ fontWeight: 'normal', fontSize: 10 }}>{i + 1}</th>)}
                  <th className="kuning" style={{ fontWeight: 'normal' }}>S</th><th className="kuning" style={{ fontWeight: 'normal' }}>I</th><th className="kuning" style={{ fontWeight: 'normal' }}>A</th><th className="kuning" style={{ fontWeight: 'normal' }}>JML</th>
                </tr>
              </thead>
              <tbody>
                {d.pegawai.urut.length === 0 && <tr><td colSpan="39" style={{ height: 60 }}>Belum ada pegawai. Isi dulu di tab <b>Data Pegawai</b>.</td></tr>}
                {d.pegawai.urut.map((id, i) => {
                  const p = d.pegawai.data[id], h = d.hadir[id] || {}, ct = d1Hitung(h);
                  const hariBulan = new Date(tahun, bulan, 0).getDate();
                  const kepsek = d1Norm(p.nama) && d1Norm(p.nama) === d1Norm(sekolah.kepsek);
                  return (
                    <tr key={id} style={{ height: 30 }}>
                      <td>{i + 1}</td>
                      <td className="kiri" style={{ fontSize: 9 }}><b>{p.nama}</b><br />{p.ttl}</td>
                      <td>{inp(['pegawai', 'data', id, 'pangkat'], false)}</td>
                      <td>{kepsek ? 'Kepala Sekolah' : (p.kelas || '-')}</td>
                      {Array.from({ length: 31 }).map((_, k) => (
                        <td key={k} className={k + 1 > hariBulan ? 'abu' : ''}>
                          {k + 1 <= hariBulan && <input className="hc" maxLength={2} value={h[String(k + 1)] || ''}
                            onChange={(e) => { const v = e.target.value.toUpperCase().replace(/H/g, '✓'); setD((x) => d1Set(x, ['hadir', id, String(k + 1)], v)); }} />}
                        </td>
                      ))}
                      <td className="abu bold">{ct.s || ''}</td><td className="abu bold">{ct.i || ''}</td><td className="abu bold">{ct.a || ''}</td><td className="abu bold">{ct.j || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ttdBlok()}
          </div>
          <p className="no-print text-[11px] text-gray-600 mt-2">Kode kolom tanggal: <b>✓</b> atau <b>H</b> = hadir, <b>S</b> = sakit, <b>I</b> = izin, <b>A</b> = alpha, <b>D</b> = dinas luar (dihitung hadir). Kolom S, I, A, JML dihitung otomatis.</p>
        </div>
      )}
    </div>
  );
};


// ===== Absensi Guru — SCAN WAJAH (dicocokkan server) + tantangan keaktifan, jam masuk/pulang dari JAM SERVER =====
const STATUS_HARI_GURU = ['Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Alpha'];
const fmtJamWIB = (ms) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(ms).replace(/\./g, ':');
const fmtTanggalWIB = (ms) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(ms);
const isoTanggalWIB = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(ms);
const gabungId = (daftar, rec) => (daftar.some((r) => r.id === rec.id) ? daftar.map((r) => (r.id === rec.id ? rec : r)) : [...daftar, rec]);

const LencanaStatus = ({ teks }) => {
  const warna = { 'Tepat Waktu': 'bg-green-100 text-green-700', Normal: 'bg-green-100 text-green-700', Terlambat: 'bg-red-100 text-red-700', 'Pulang Awal': 'bg-orange-100 text-orange-700',
                  Hadir: 'bg-green-100 text-green-700', Izin: 'bg-blue-100 text-blue-700', Sakit: 'bg-yellow-100 text-yellow-700', 'Dinas Luar': 'bg-indigo-100 text-indigo-700', Alpha: 'bg-red-100 text-red-700' };
  return teks ? <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${warna[teks] || 'bg-gray-100 text-gray-600'}`}>{teks}</span> : null;
};

// ===== Absensi Guru — QR + kedip mata (tanpa foto/video/data wajah); jam masuk/pulang dari JAM SERVER =====
const AbsensiGuru = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const role = DB.user.role;
  const bisaAbsen = ['guru', 'kepsek'].includes(role);
  const pengelola = ['admin', 'kepsek'].includes(role);
  const [proses, jalankan] = useAksi();

  // ---- jam resmi: diselaraskan dengan jam server ----
  const [offset, setOffset] = useState(0);
  const [tersinkron, setTersinkron] = useState(false);
  const [batas, setBatas] = useState({ masuk: sekolah.jamMasukGuru || '07:30', pulang: sekolah.jamPulangGuru || '13:00' });
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t0 = Date.now();
    apiPanggil('waktuServer').then((res) => {
      const t1 = Date.now();
      setOffset(res.data.epoch + (t1 - t0) / 2 - t1);
      setTersinkron(true);
      setBatas({ masuk: res.data.batasMasuk, pulang: res.data.batasPulang });
    }).catch(() => {});
    const id = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const sekarangMs = tick + offset;
  const hariIni = isoTanggalWIB(sekarangMs);

  // ---- data absensi guru (disaring server sesuai peran) ----
  const [riwayat, setRiwayat] = useState([]);
  const [siap, setSiap] = useState(false);
  const muatRiwayat = () => apiPanggil('list', { tabel: 'Absensi_Guru' }).then((res) => { setRiwayat(res.data); setSiap(true); })
    .catch((e) => { showAlert('Gagal memuat absensi guru: ' + e.message, 'error'); setSiap(true); });
  useEffect(() => { muatRiwayat(); }, []);
  const milikku = (r) => role === 'guru' || r.username === DB.user.username;
  const hariIniku = riwayat.find((r) => r.tanggal === hariIni && milikku(r)) || null;
  const aksiBerikut = !hariIniku || !hariIniku.jamMasuk ? 'masuk' : !hariIniku.jamPulang ? 'pulang' : null;
  const sesudahScan = (d) => { if (d && d.tabel === 'Absensi_Guru' && d.catatan) setRiwayat((r) => gabungId(r, d.catatan)); };

  // ---- pengaturan jam kerja (admin/kepsek) ----
  const [jamKerja, setJamKerja] = useState({ masuk: sekolah.jamMasukGuru || '07:30', pulang: sekolah.jamPulangGuru || '13:00' });
  const simpanJam = () => jalankan(async () => {
    await DB.simpanPengaturan({ jamMasukGuru: jamKerja.masuk, jamPulangGuru: jamKerja.pulang });
    setBatas(jamKerja);
    showAlert('Jam kerja guru disimpan.');
  });

  // ---- rekap ----
  const [bulan, setBulan] = useState(hariIni.slice(0, 7));
  const [filterGuru, setFilterGuru] = useState('');
  const baris = riwayat.filter((r) => String(r.tanggal).startsWith(bulan) && (!filterGuru || r.guru === filterGuru))
    .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)) || String(a.guru).localeCompare(String(b.guru)));
  const namaGuruAda = [...new Set(riwayat.map((r) => r.guru))].sort();
  const ringkasan = namaGuruAda.map((g) => {
    const x = baris.filter((r) => r.guru === g);
    const h = (st) => x.filter((r) => r.statusHari === st).length;
    return { guru: g, total: x.length, hadir: h('Hadir'), terlambat: x.filter((r) => r.statusMasuk === 'Terlambat').length, awal: x.filter((r) => r.statusPulang === 'Pulang Awal').length, izin: h('Izin'), sakit: h('Sakit'), dinas: h('Dinas Luar'), alpha: h('Alpha') };
  }).filter((s) => s.total > 0);

  const [suratInfo, setSuratInfo] = useState(null);
  const tandaiAlfa = () => {
    if (!confirm('Tandai ALPHA semua guru yang belum tercatat hari ini (tanpa QR)? Lakukan di akhir jam kerja.')) return;
    jalankan(async () => { const res = await apiPanggil('tandaiAlfa', { jenis: 'guru' }); showAlert(res.message); await muatRiwayat(); });
  };

  const KOSONG = { id: '', tanggal: hariIni, guru: '', statusHari: 'Hadir', jamMasuk: '', jamPulang: '', keterangan: '' };
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(KOSONG);
  const guruList = DB.rows('Guru');
  const simpanManual = (e) => {
    e.preventDefault();
    jalankan(async () => {
      const res = await apiPanggil('saveAbsenGuruManual', { data: form });
      setRiwayat((r) => gabungId(r, res.data));
      setModal(false);
      showAlert(res.message);
    });
  };
  const hapus = (r) => {
    if (confirm(`Hapus catatan ${r.guru} tanggal ${r.tanggal}?`))
      jalankan(async () => { await DB.hapus('Absensi_Guru', r.id); setRiwayat((x) => x.filter((y) => y.id !== r.id)); showAlert('Catatan dihapus.'); });
  };
  const inp = 'w-full border p-2 rounded mt-1 text-sm';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-700 to-emerald-600 text-white rounded-lg p-6 text-center shadow no-print">
        <p className="text-sm opacity-90">{fmtTanggalWIB(sekarangMs)}</p>
        <p className="text-5xl font-extrabold tabular-nums tracking-wider my-1">{fmtJamWIB(sekarangMs)}</p>
        <p className="text-xs opacity-90">WIB · {tersinkron ? 'diselaraskan dengan jam server' : 'jam perangkat — jam resmi tetap dicatat server saat absen'}</p>
        <p className="text-xs mt-1 opacity-90">Batas masuk {batas.masuk} · Pulang mulai {batas.pulang}</p>
      </div>

      {bisaAbsen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
            <h3 className="font-bold text-gray-700"><i className="fas fa-qrcode text-green-600"></i> Absen dengan QR + Kedip Mata</h3>
            {!siap ? <KosongInfo teks="Memuat data absensi…" /> : <ScannerAbsenKedip jenisAwal={aksiBerikut || 'masuk'} onSukses={sesudahScan} />}
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3 self-start">
            <h3 className="font-bold text-gray-700"><i className="fas fa-clipboard-check text-green-600"></i> Status Hari Ini</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-4 text-center"><p className="text-xs text-gray-500">Masuk</p><p className="text-2xl font-bold tabular-nums">{hariIniku && hariIniku.jamMasuk ? hariIniku.jamMasuk : '--:--:--'}</p><LencanaStatus teks={hariIniku && hariIniku.statusMasuk} /></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-xs text-gray-500">Pulang</p><p className="text-2xl font-bold tabular-nums">{hariIniku && hariIniku.jamPulang ? hariIniku.jamPulang : '--:--:--'}</p><LencanaStatus teks={hariIniku && hariIniku.statusPulang} /></div>
            </div>
            {hariIniku && hariIniku.statusHari !== 'Hadir' && <p className="text-xs text-gray-600">Status hari ini: <LencanaStatus teks={hariIniku.statusHari} /> {hariIniku.keterangan}</p>}
            <p className="text-[11px] text-gray-500">Kartu QR guru dicetak oleh admin di menu <b>Kartu QR Absensi</b>. Pilih <b>Masuk</b> atau <b>Pulang</b> sebelum memindai. Izin/Sakit: pilih kategorinya lalu lampirkan surat.</p>
          </div>
        </div>
      )}

      {pengelola && (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap items-end gap-3 no-print">
          <div><label className="text-xs font-semibold text-gray-600">Batas jam masuk (lewat = Terlambat)</label><input type="time" value={jamKerja.masuk} onChange={(e) => setJamKerja({ ...jamKerja, masuk: e.target.value })} className="border p-2 rounded text-sm block mt-1" /></div>
          <div><label className="text-xs font-semibold text-gray-600">Jam pulang paling awal</label><input type="time" value={jamKerja.pulang} onChange={(e) => setJamKerja({ ...jamKerja, pulang: e.target.value })} className="border p-2 rounded text-sm block mt-1" /></div>
          <button onClick={simpanJam} disabled={proses || !jamKerja.masuk || !jamKerja.pulang} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded text-sm font-bold">Simpan Jam Kerja</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between no-print">
          <h3 className="font-bold text-gray-700">{pengelola ? 'Rekap Absensi Guru' : 'Riwayat Absensi Saya'}</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className="border p-2 rounded text-sm" />
            {pengelola && <select value={filterGuru} onChange={(e) => setFilterGuru(e.target.value)} className="border p-2 rounded text-sm bg-white"><option value="">Semua guru</option>{namaGuruAda.map((g) => <option key={g}>{g}</option>)}</select>}
            {pengelola && <button onClick={tandaiAlfa} disabled={proses} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-user-times mr-1"></i> Tandai Alfa (belum absen)</button>}
            {pengelola && <button onClick={() => { setForm({ ...KOSONG, tanggal: hariIni }); setModal(true); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-plus mr-1"></i> Isi / Koreksi Manual</button>}
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-print mr-1"></i> Cetak</button>
          </div>
        </div>

        <div id="printable-a4-area" className="p-4 space-y-4 bg-white text-black">
          <div className="text-center hidden print:block">
            <h2 className="font-bold text-base uppercase">Rekap Absensi Guru — {sekolah.namaSekolah}</h2>
            <p className="text-xs">Bulan {BULAN_ID[Number(bulan.slice(5, 7)) - 1]} {bulan.slice(0, 4)}</p>
          </div>
          {pengelola && ringkasan.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400 text-center">
                <thead className="bg-gray-100"><tr><th className="border border-gray-400 p-1.5 text-left">Guru</th><th className="border border-gray-400 p-1.5">Hadir</th><th className="border border-gray-400 p-1.5">Terlambat</th><th className="border border-gray-400 p-1.5">Pulang Awal</th><th className="border border-gray-400 p-1.5">Izin</th><th className="border border-gray-400 p-1.5">Sakit</th><th className="border border-gray-400 p-1.5">Dinas Luar</th><th className="border border-gray-400 p-1.5">Alpha</th></tr></thead>
                <tbody>{ringkasan.map((s) => <tr key={s.guru}><td className="border border-gray-400 p-1.5 text-left font-semibold">{s.guru}</td><td className="border border-gray-400 p-1.5">{s.hadir}</td><td className="border border-gray-400 p-1.5">{s.terlambat}</td><td className="border border-gray-400 p-1.5">{s.awal}</td><td className="border border-gray-400 p-1.5">{s.izin}</td><td className="border border-gray-400 p-1.5">{s.sakit}</td><td className="border border-gray-400 p-1.5">{s.dinas}</td><td className="border border-gray-400 p-1.5">{s.alpha}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {!siap ? <KosongInfo teks="Memuat…" /> : baris.length === 0 ? <KosongInfo teks="Belum ada catatan absensi pada bulan ini." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead className="bg-gray-100"><tr><th className="border border-gray-400 p-1.5">Tanggal</th><th className="border border-gray-400 p-1.5 text-left">Guru (NIP/NIY)</th><th className="border border-gray-400 p-1.5">Kategori</th><th className="border border-gray-400 p-1.5">Masuk</th><th className="border border-gray-400 p-1.5">Pulang</th><th className="border border-gray-400 p-1.5 text-left">Keterangan</th>{pengelola && <th className="border border-gray-400 p-1.5 no-print">Surat</th>}{pengelola && <th className="border border-gray-400 p-1.5 no-print">Aksi</th>}</tr></thead>
                <tbody>
                  {baris.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-1.5 whitespace-nowrap">{tanggalPanjang(r.tanggal)}</td>
                      <td className="border border-gray-400 p-1.5 font-medium">{r.guru}{r.nip ? <span className="block text-[10px] text-gray-500 font-normal">{r.nip}</span> : null}</td>
                      <td className="border border-gray-400 p-1.5 text-center"><LencanaStatus teks={r.statusHari} /></td>
                      <td className="border border-gray-400 p-1.5 text-center whitespace-nowrap">{r.jamMasuk || '-'} <LencanaStatus teks={r.statusMasuk} /></td>
                      <td className="border border-gray-400 p-1.5 text-center whitespace-nowrap">{r.jamPulang || '-'} <LencanaStatus teks={r.statusPulang} /></td>
                      <td className="border border-gray-400 p-1.5">{r.keterangan}</td>
                      {pengelola && <td className="border border-gray-400 p-1.5 text-center no-print">{r.suratId ? <button onClick={() => bacaSuratAbsen('Absensi_Guru', r.id, `Surat ${r.statusHari} — ${r.guru}`, setSuratInfo)} className="text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-50"><i className="fas fa-file-alt"></i> Lihat</button> : null}</td>}
                      {pengelola && <td className="border border-gray-400 p-1.5 text-center no-print whitespace-nowrap">
                        <button onClick={() => { setForm({ ...KOSONG, ...r, jamMasuk: String(r.jamMasuk || '').slice(0, 5), jamPulang: String(r.jamPulang || '').slice(0, 5) }); setModal(true); }} className="text-yellow-600 border border-yellow-200 px-1.5 py-0.5 rounded hover:bg-yellow-50 mr-1"><i className="fas fa-edit"></i></button>
                        <button onClick={() => hapus(r)} className="text-red-600 border border-red-200 px-1.5 py-0.5 rounded hover:bg-red-50"><i className="fas fa-trash"></i></button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PenampilSurat info={suratInfo} tutup={() => setSuratInfo(null)} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Koreksi Absensi Guru' : 'Isi Absensi Guru Manual'}>
        <form onSubmit={simpanManual} className="space-y-3">
          <div><label className="text-xs font-semibold text-gray-600">Guru</label>
            <select required value={form.guru} onChange={(e) => setForm({ ...form, guru: e.target.value })} className={inp + ' bg-white'}><option value="">-- Pilih guru --</option>{guruList.map((g) => <option key={g.id} value={g.nama}>{g.nama}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600">Tanggal</label><input type="date" required value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className={inp} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Status</label><select value={form.statusHari} onChange={(e) => setForm({ ...form, statusHari: e.target.value })} className={inp + ' bg-white'}>{STATUS_HARI_GURU.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-gray-600">Jam masuk</label><input type="time" value={form.jamMasuk} onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })} className={inp} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Jam pulang</label><input type="time" value={form.jamPulang} onChange={(e) => setForm({ ...form, jamPulang: e.target.value })} className={inp} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600">Keterangan</label><input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Cth: dinas ke dinas pendidikan, lupa absen" className={inp} /></div>
          <button type="submit" disabled={proses} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-2.5 rounded font-bold">Simpan</button>
        </form>
      </Modal>
    </div>
  );
};

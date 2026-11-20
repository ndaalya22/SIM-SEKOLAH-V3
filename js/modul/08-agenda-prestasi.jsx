// ============================================================================
//  JS_AgendaPrestasi — Modul BARU (tidak mengubah modul lain):
//   1. DashboardUtama : Dashboard lama + Siswa Lulusan, grafik siswa per tahun ajaran,
//                       grafik siswa berprestasi
//   2. AgendaKegiatan : kalender kegiatan sekolah (input hanya admin, lainnya hanya melihat)
//   3. PrestasiSiswa  : galeri prestasi dalam & luar sekolah (input/unggah hanya admin)
//  Dimuat SETELAH JS_Laporan dan SEBELUM JS_App.
// ============================================================================

const TINGKAT_PRESTASI = ['Sekolah', 'Kecamatan', 'Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'];
const LINGKUP_PRESTASI = ['Dalam Sekolah', 'Luar Sekolah'];

const KATEGORI_AGENDA = {
  'Akademik':       { titik: 'bg-blue-500',   chip: 'bg-blue-100 text-blue-800',     ikon: 'fa-book-open' },
  'Ujian':          { titik: 'bg-orange-500', chip: 'bg-orange-100 text-orange-800', ikon: 'fa-pen' },
  'Libur':          { titik: 'bg-rose-500',   chip: 'bg-rose-100 text-rose-800',     ikon: 'fa-umbrella-beach' },
  'Kegiatan Siswa': { titik: 'bg-purple-500', chip: 'bg-purple-100 text-purple-800', ikon: 'fa-users' },
  'Rapat':          { titik: 'bg-amber-500',  chip: 'bg-amber-100 text-amber-800',   ikon: 'fa-handshake' },
  'Keagamaan':      { titik: 'bg-teal-500',   chip: 'bg-teal-100 text-teal-800',     ikon: 'fa-mosque' },
  'Lainnya':        { titik: 'bg-gray-500',   chip: 'bg-gray-100 text-gray-800',     ikon: 'fa-thumbtack' }
};
const NAMA_HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const isoTgl = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const fotoBesar = (url) => String(url || '').replace(/sz=w\d+/, 'sz=w1200');

// ---------------------------------------------------------------------------
// 1. DASHBOARD
// ---------------------------------------------------------------------------
const WARNA_BATANG = {
  blue:   { batang: 'bg-blue-500 hover:bg-blue-700',     ikon: 'text-blue-600' },
  green:  { batang: 'bg-green-500 hover:bg-green-700',   ikon: 'text-green-600' },
  amber:  { batang: 'bg-amber-500 hover:bg-amber-600',   ikon: 'text-amber-600' },
  purple: { batang: 'bg-purple-500 hover:bg-purple-700', ikon: 'text-purple-600' }
};
const tinggiBatang = (nilai, maks) => Math.max(nilai > 0 ? 6 : 0, Math.round((nilai / Math.max(1, maks)) * 150));

const KartuStat = ({ label, nilai, warna, ikon }) => (
  <div className={`bg-white p-4 rounded-lg border shadow-sm border-l-4 ${warna} flex items-center justify-between`}>
    <div><p className="text-sm text-gray-500">{label}</p><h3 className="text-2xl font-bold">{nilai}</h3></div>
    <i className={`fas ${ikon} text-2xl text-gray-300`}></i>
  </div>
);

const GrafikBatang = ({ judul, ikon, warna, data, pesanKosong }) => {
  const maks = Math.max(1, ...data.map((d) => d.nilai));
  const w = WARNA_BATANG[warna] || WARNA_BATANG.blue;
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="font-bold text-gray-700 mb-4 border-b pb-2"><i className={`fas ${ikon} ${w.ikon}`}></i> {judul}</h3>
      {data.length === 0 ? <KosongInfo teks={pesanKosong} /> : (
        <div className="flex items-end justify-around h-48 border-b-2 border-gray-200 pb-2 gap-2">
          {data.map((d, i) => (
            <div key={i} className="flex flex-col items-center justify-end h-full flex-1">
              <span className="text-[11px] font-bold mb-1 text-gray-600">{d.nilai}</span>
              <div className={`${w.batang} w-full max-w-[48px] rounded-t transition-all duration-500`} style={{ height: tinggiBatang(d.nilai, maks) }}></div>
              <span className="text-[10px] font-semibold mt-2 text-center leading-tight" title={d.label}>{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Batang bertumpuk: laki-laki / perempuan / belum diisi, per tahun ajaran
const GrafikSiswaTahun = ({ data }) => {
  const maks = Math.max(1, ...data.map((d) => d.l + d.p + d.lain));
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="font-bold text-gray-700 mb-1 border-b pb-2"><i className="fas fa-chart-column text-blue-600"></i> Jumlah Siswa per Tahun Ajaran</h3>
      <div className="flex gap-3 text-[10px] text-gray-500 mb-3 mt-2">
        <span><i className="fas fa-square text-blue-500"></i> Laki-laki</span>
        <span><i className="fas fa-square text-pink-500"></i> Perempuan</span>
        <span><i className="fas fa-square text-gray-400"></i> JK belum diisi</span>
      </div>
      {data.length === 0 ? <KosongInfo teks="Belum ada data. Isi kolom Tahun Ajaran pada Data Siswa." /> : (
        <div className="flex items-end justify-around h-48 border-b-2 border-gray-200 pb-2 gap-2">
          {data.map((d) => {
            const total = d.l + d.p + d.lain;
            return (
              <div key={d.tahun} className="flex flex-col items-center justify-end h-full flex-1">
                <span className="text-[11px] font-bold mb-1 text-gray-600">{total}</span>
                <div className="w-full max-w-[48px] rounded-t overflow-hidden flex flex-col-reverse transition-all duration-500" style={{ height: tinggiBatang(total, maks) }} title={`L: ${d.l} • P: ${d.p}${d.lain ? ' • ?: ' + d.lain : ''}`}>
                  <div className="bg-blue-500" style={{ flexGrow: d.l }}></div>
                  <div className="bg-pink-500" style={{ flexGrow: d.p }}></div>
                  <div className="bg-gray-400" style={{ flexGrow: d.lain }}></div>
                </div>
                <span className="text-[10px] font-semibold mt-2 text-center leading-tight">{d.tahun}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DashboardUtama = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const st = DB.statistik;
  const pengumuman = [...DB.rows('Pengumuman')].sort((a, b) => String(b.tgl).localeCompare(String(a.tgl))).slice(0, 4);
  const prestasi = DB.rows('Prestasi');
  const singkat = (k) => String(k).split(' ')[0];

  const dataSiswa = st.perRombel.map((r) => ({ label: singkat(r.kelas), nilai: r.jumlah }));
  const dataAbsensi = st.perRombel.map((r) => ({ label: singkat(r.kelas), nilai: r.hadir }));
  const dataTahun = st.siswaPerTahun || [];
  const dataPrestasi = TINGKAT_PRESTASI.map((t) => ({ label: t, nilai: prestasi.filter((p) => p.tingkat === t).length }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KartuStat label="Total Siswa Aktif" nilai={st.totalSiswa} warna="border-l-blue-500" ikon="fa-user-graduate" />
        <KartuStat label="Guru & Tenaga Pendidik" nilai={st.totalGuru} warna="border-l-green-500" ikon="fa-chalkboard-teacher" />
        <KartuStat label="Total Rombel" nilai={st.totalRombel} warna="border-l-yellow-500" ikon="fa-door-open" />
        <KartuStat label="Siswa Hadir Hari Ini" nilai={`${st.hadirHariIni} / ${st.totalSiswa}`} warna="border-l-purple-500" ikon="fa-clipboard-check" />
        <KartuStat label="Siswa Lulusan" nilai={st.totalLulusan || 0} warna="border-l-rose-500" ikon="fa-graduation-cap" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GrafikBatang judul="Jumlah Siswa per Rombel" ikon="fa-chart-bar" warna="blue" data={dataSiswa} pesanKosong="Belum ada rombel. Tambahkan di Pengaturan Sistem → Rombel." />
        <GrafikBatang judul="Siswa Hadir Hari Ini per Rombel" ikon="fa-chart-line" warna="green" data={dataAbsensi} pesanKosong="Belum ada rombel. Tambahkan di Pengaturan Sistem → Rombel." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GrafikSiswaTahun data={dataTahun} />
        <div>
          <GrafikBatang judul={`Siswa Berprestasi per Tingkat (${prestasi.length} prestasi)`} ikon="fa-trophy" warna="amber" data={prestasi.length ? dataPrestasi : []} pesanKosong="Belum ada data prestasi. Admin dapat menambahkannya di menu Prestasi Siswa." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-bullhorn text-yellow-600"></i> Pengumuman Terbaru</h3>
          {pengumuman.length === 0 ? <KosongInfo teks="Belum ada pengumuman." /> : pengumuman.map((p) => (
            <div key={p.id} className="py-2 border-b last:border-b-0 text-sm"><p className="font-semibold text-gray-800">{p.judul}</p><p className="text-xs text-gray-500">{tanggalPanjang(p.tgl)}</p></div>
          ))}
        </div>
        {st.tunggakan !== null && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-money-check-alt text-red-600"></i> Ringkasan Keuangan</h3>
            <p className="text-sm text-gray-500">Total tunggakan seluruh siswa</p>
            <p className="text-2xl font-extrabold text-red-600">{formatRupiah(st.tunggakan)}</p>
            <p className="text-xs text-gray-400 mt-2">Tahun ajaran {sekolah.tahunAjaran}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. AGENDA KEGIATAN (kalender)
// ---------------------------------------------------------------------------
const rentangTanggal = (a) => (a.tglSelesai && a.tglSelesai !== a.tglMulai)
  ? `${tanggalPanjang(a.tglMulai)} – ${tanggalPanjang(a.tglSelesai)}` : tanggalPanjang(a.tglMulai);

const AgendaKegiatan = () => {
  const DB = useDB();
  const bisaKelola = DB.user.role === 'admin';          // hanya admin yang boleh mengubah (dicek juga di server)
  const [proses, jalankan] = useAksi();
  const hari = DB.hariIni;
  const [tahun, setTahun] = useState(Number(hari.slice(0, 4)));
  const [bulan, setBulan] = useState(Number(hari.slice(5, 7)) - 1);
  const [dipilih, setDipilih] = useState(hari);
  const [form, setForm] = useState(null);                // null = modal tertutup
  const daftar = DB.rows('Agenda');

  const FORM_KOSONG = (tgl) => ({ id: '', judul: '', kategori: 'Akademik', tglMulai: tgl, tglSelesai: '', jamMulai: '', jamSelesai: '', lokasi: '', deskripsi: '' });
  const acaraPada = (iso) => daftar
    .filter((a) => a.tglMulai <= iso && (a.tglSelesai || a.tglMulai) >= iso)
    .sort((a, b) => String(a.jamMulai).localeCompare(String(b.jamMulai)));

  const geser = (n) => {
    let m = bulan + n, y = tahun;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setBulan(m); setTahun(y);
  };
  const keHariIni = () => { setTahun(Number(hari.slice(0, 4))); setBulan(Number(hari.slice(5, 7)) - 1); setDipilih(hari); };

  const awalHari = (new Date(tahun, bulan, 1).getDay() + 6) % 7;          // Senin = 0
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const sel = [];
  for (let i = 0; i < awalHari; i++) sel.push(null);
  for (let d = 1; d <= jumlahHari; d++) sel.push(d);
  while (sel.length % 7 !== 0) sel.push(null);

  const mendatang = daftar
    .filter((a) => (a.tglSelesai || a.tglMulai) >= hari)
    .sort((a, b) => String(a.tglMulai).localeCompare(String(b.tglMulai))).slice(0, 6);
  const acaraDipilih = acaraPada(dipilih);

  const simpan = (e) => {
    e.preventDefault();
    if (form.tglSelesai && form.tglSelesai < form.tglMulai) { showAlert('Gagal: tanggal selesai tidak boleh sebelum tanggal mulai.', 'error'); return; }
    jalankan(async () => {
      await DB.simpan('Agenda', form);
      showAlert(form.id ? 'Agenda berhasil diperbarui.' : 'Agenda berhasil ditambahkan.');
      setForm(null);
    });
  };
  const hapus = (a) => {
    if (confirm(`Hapus agenda "${a.judul}"?`)) jalankan(async () => { await DB.hapus('Agenda', a.id); showAlert('Agenda dihapus.'); });
  };
  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const KartuAgenda = ({ a }) => {
    const k = KATEGORI_AGENDA[a.kategori] || KATEGORI_AGENDA.Lainnya;
    return (
      <div className="border rounded-lg p-3 bg-white shadow-sm flex gap-3">
        <div className={`w-1.5 rounded-full ${k.titik} shrink-0`}></div>
        <div className="flex-1 min-w-0 text-sm">
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${k.chip}`}><i className={`fas ${k.ikon} mr-1`}></i>{a.kategori}</span>
          <p className="font-bold text-gray-800 mt-1">{a.judul}</p>
          <p className="text-xs text-gray-500"><i className="far fa-calendar mr-1"></i>{rentangTanggal(a)}</p>
          {(a.jamMulai || a.jamSelesai) && <p className="text-xs text-gray-500"><i className="far fa-clock mr-1"></i>{a.jamMulai}{a.jamSelesai ? ' – ' + a.jamSelesai : ''} WIB</p>}
          {a.lokasi && <p className="text-xs text-gray-500"><i className="fas fa-map-marker-alt mr-1"></i>{a.lokasi}</p>}
          {a.deskripsi && <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{a.deskripsi}</p>}
        </div>
        {bisaKelola && (
          <div className="flex flex-col gap-1">
            <button onClick={() => setForm({ ...FORM_KOSONG(a.tglMulai), ...a })} className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded border border-yellow-200 text-xs" title="Ubah"><i className="fas fa-edit"></i></button>
            <button onClick={() => hapus(a)} className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 text-xs" title="Hapus"><i className="fas fa-trash"></i></button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* KALENDER */}
      <div className="xl:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-emerald-500 text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-green-100">Agenda Kegiatan</p>
            <h3 className="text-2xl font-extrabold">{BULAN_ID[bulan]} {tahun}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => geser(-1)} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30" aria-label="Bulan sebelumnya"><i className="fas fa-chevron-left"></i></button>
            <button onClick={keHariIni} className="px-3 h-9 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold">Hari Ini</button>
            <button onClick={() => geser(1)} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30" aria-label="Bulan berikutnya"><i className="fas fa-chevron-right"></i></button>
            {bisaKelola && <button onClick={() => setForm(FORM_KOSONG(dipilih))} className="px-3 h-9 rounded-full bg-white text-green-700 hover:bg-green-50 text-sm font-bold shadow"><i className="fas fa-plus mr-1"></i>Agenda</button>}
          </div>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-500 mb-1">
            {NAMA_HARI_PENDEK.map((h, i) => <div key={h} className={`py-1 ${i === 6 ? 'text-red-500' : ''}`}>{h}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {sel.map((d, i) => {
              if (!d) return <div key={i} className="min-h-[56px] sm:min-h-[96px] rounded bg-gray-50/60"></div>;
              const iso = isoTgl(tahun, bulan, d);
              const acara = acaraPada(iso);
              const adalahHariIni = iso === hari, adalahDipilih = iso === dipilih;
              return (
                <button key={i} onClick={() => setDipilih(iso)}
                  className={`min-h-[56px] sm:min-h-[96px] rounded border p-1 text-left flex flex-col transition-colors ${adalahDipilih ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${adalahHariIni ? 'bg-green-600 text-white' : (i % 7 === 6 ? 'text-red-500' : 'text-gray-700')}`}>{d}</span>
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1 w-full">
                    {acara.slice(0, 3).map((a) => (
                      <span key={a.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${(KATEGORI_AGENDA[a.kategori] || KATEGORI_AGENDA.Lainnya).chip}`} title={a.judul}>{a.judul}</span>
                    ))}
                    {acara.length > 3 && <span className="text-[10px] text-gray-500 px-1">+{acara.length - 3} lagi</span>}
                  </div>
                  <div className="flex sm:hidden gap-0.5 mt-1 flex-wrap">
                    {acara.slice(0, 4).map((a) => <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${(KATEGORI_AGENDA[a.kategori] || KATEGORI_AGENDA.Lainnya).titik}`}></span>)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[11px] text-gray-600">
            {Object.keys(KATEGORI_AGENDA).map((k) => <span key={k}><i className={`fas fa-circle text-[8px] mr-1 ${KATEGORI_AGENDA[k].titik.replace('bg-', 'text-')}`}></i>{k}</span>)}
          </div>
        </div>
      </div>

      {/* PANEL SAMPING */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-calendar-day text-green-600"></i> {tanggalPanjang(dipilih)}</h3>
          <div className="space-y-2">
            {acaraDipilih.length === 0 ? <KosongInfo teks="Tidak ada agenda pada tanggal ini." /> : acaraDipilih.map((a) => <KartuAgenda key={a.id} a={a} />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-forward text-blue-600"></i> Agenda Mendatang</h3>
          <div className="space-y-2">
            {mendatang.length === 0 ? <KosongInfo teks="Belum ada agenda mendatang." /> : mendatang.map((a) => <KartuAgenda key={a.id} a={a} />)}
          </div>
        </div>
      </div>

      {/* FORM (hanya admin) */}
      {bisaKelola && (
        <Modal isOpen={!!form} onClose={() => setForm(null)} title={form && form.id ? 'Ubah Agenda' : 'Tambah Agenda'} size="max-w-lg">
          {form && (
            <form onSubmit={simpan} className="space-y-3 text-sm">
              <div><label className="text-xs font-semibold text-gray-600">Nama Kegiatan</label>
                <input name="judul" required value={form.judul} onChange={ubah} className="w-full border p-2 rounded mt-1" placeholder="Cth: Penilaian Tengah Semester" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Kategori</label>
                <select name="kategori" value={form.kategori} onChange={ubah} className="w-full border p-2 rounded mt-1">
                  {Object.keys(KATEGORI_AGENDA).map((k) => <option key={k}>{k}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-600">Tanggal Mulai</label>
                  <input name="tglMulai" type="date" required value={form.tglMulai} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-xs font-semibold text-gray-600">Tanggal Selesai (opsional)</label>
                  <input name="tglSelesai" type="date" min={form.tglMulai} value={form.tglSelesai} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-xs font-semibold text-gray-600">Jam Mulai</label>
                  <input name="jamMulai" type="time" value={form.jamMulai} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-xs font-semibold text-gray-600">Jam Selesai</label>
                  <input name="jamSelesai" type="time" value={form.jamSelesai} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-600">Lokasi</label>
                <input name="lokasi" value={form.lokasi} onChange={ubah} className="w-full border p-2 rounded mt-1" placeholder="Cth: Aula sekolah" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Keterangan</label>
                <textarea name="deskripsi" rows="3" value={form.deskripsi} onChange={ubah} className="w-full border p-2 rounded mt-1"></textarea></div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={proses} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-2.5 rounded font-bold">{proses ? 'Menyimpan…' : 'Simpan Agenda'}</button>
                <button type="button" onClick={() => setForm(null)} className="bg-gray-400 text-white px-4 rounded">Batal</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. PRESTASI SISWA (galeri)
// ---------------------------------------------------------------------------
const WARNA_TINGKAT = {
  'Sekolah': 'bg-gray-600', 'Kecamatan': 'bg-sky-600', 'Kabupaten/Kota': 'bg-blue-600',
  'Provinsi': 'bg-indigo-600', 'Nasional': 'bg-red-600', 'Internasional': 'bg-purple-700'
};
const warnaMedali = (peringkat) => {
  const p = String(peringkat || '');
  if (/1|emas|pertama/i.test(p)) return 'text-yellow-500';
  if (/2|perak|kedua/i.test(p)) return 'text-gray-400';
  if (/3|perunggu|ketiga/i.test(p)) return 'text-amber-700';
  return 'text-blue-500';
};

const FotoPrestasi = ({ p, besar }) => (
  p.foto
    ? <img src={besar ? fotoBesar(p.foto) : p.foto} alt={p.judul} loading="lazy" className="w-full h-full object-cover" />
    : <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 flex items-center justify-center"><i className="fas fa-trophy text-white/90 text-5xl drop-shadow"></i></div>
);

const PrestasiSiswa = () => {
  const DB = useDB();
  const bisaKelola = DB.user.role === 'admin';          // hanya admin yang boleh menambah/mengunggah (dicek juga di server)
  const [proses, jalankan] = useAksi();
  const daftar = [...DB.rows('Prestasi')].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  const [fLingkup, setFLingkup] = useState('');
  const [fTingkat, setFTingkat] = useState('');
  const [fTahun, setFTahun] = useState('');
  const [cari, setCari] = useState('');
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);

  const daftarTahun = [...new Set(daftar.map((p) => String(p.tanggal).slice(0, 4)).filter(Boolean))];
  const tampil = daftar.filter((p) =>
    (!fLingkup || p.lingkup === fLingkup) && (!fTingkat || p.tingkat === fTingkat) &&
    (!fTahun || String(p.tanggal).slice(0, 4) === fTahun) &&
    (!cari || `${p.judul} ${p.namaSiswa} ${p.penyelenggara}`.toLowerCase().includes(cari.toLowerCase())));

  const FORM_KOSONG = () => ({ id: '', nisn: '', namaSiswa: '', kelas: '', judul: '', lingkup: 'Dalam Sekolah', tingkat: 'Sekolah', peringkat: '', penyelenggara: '', tanggal: DB.hariIni, deskripsi: '', foto: '' });
  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const pilihNama = (e) => {
    const nama = e.target.value;
    const s = DB.rows('Siswa').filter((x) => String(x.nama).toLowerCase() === nama.toLowerCase())[0];
    setForm({ ...form, namaSiswa: nama, nisn: s ? s.nisn : '', kelas: s && s.kelas ? s.kelas : form.kelas });
  };
  const unggahFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'foto');
      setForm((f) => ({ ...f, foto: hasil.url }));
      showAlert('Foto berhasil diunggah.');
    });
  };
  const simpan = (e) => {
    e.preventDefault();
    jalankan(async () => {
      await DB.simpan('Prestasi', form);
      showAlert(form.id ? 'Prestasi berhasil diperbarui.' : 'Prestasi berhasil ditambahkan.');
      setForm(null);
    });
  };
  const hapus = (p) => {
    if (confirm(`Hapus prestasi "${p.judul}" milik ${p.namaSiswa}?`))
      jalankan(async () => { await DB.hapus('Prestasi', p.id); setDetail(null); showAlert('Prestasi dihapus.'); });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow">
        <div className="flex items-center gap-4">
          <i className="fas fa-trophy text-4xl text-yellow-200"></i>
          <div><h3 className="text-xl font-extrabold">Prestasi Siswa</h3><p className="text-xs text-amber-50">Kebanggaan sekolah, di dalam maupun di luar sekolah</p></div>
        </div>
        <div className="flex gap-3 text-center">
          {[['Total', daftar.length], ['Dalam Sekolah', daftar.filter((p) => p.lingkup === 'Dalam Sekolah').length], ['Luar Sekolah', daftar.filter((p) => p.lingkup === 'Luar Sekolah').length]].map(([l, n]) => (
            <div key={l} className="bg-white/20 rounded-lg px-4 py-2"><p className="text-xl font-extrabold leading-none">{n}</p><p className="text-[10px] uppercase tracking-wide">{l}</p></div>
          ))}
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border shadow-sm flex flex-wrap gap-2 items-center text-sm">
        <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari siswa / kegiatan…" className="border p-2 rounded flex-1 min-w-[160px]" />
        <select value={fLingkup} onChange={(e) => setFLingkup(e.target.value)} className="border p-2 rounded"><option value="">Semua Lingkup</option>{LINGKUP_PRESTASI.map((l) => <option key={l}>{l}</option>)}</select>
        <select value={fTingkat} onChange={(e) => setFTingkat(e.target.value)} className="border p-2 rounded"><option value="">Semua Tingkat</option>{TINGKAT_PRESTASI.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={fTahun} onChange={(e) => setFTahun(e.target.value)} className="border p-2 rounded"><option value="">Semua Tahun</option>{daftarTahun.map((t) => <option key={t}>{t}</option>)}</select>
        {bisaKelola && <button onClick={() => setForm(FORM_KOSONG())} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded font-bold"><i className="fas fa-plus mr-1"></i>Tambah Prestasi</button>}
      </div>

      {tampil.length === 0 ? (
        <div className="bg-white rounded-lg border"><KosongInfo teks={daftar.length ? 'Tidak ada prestasi yang cocok dengan filter.' : 'Belum ada data prestasi.'} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tampil.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <button onClick={() => setDetail(p)} className="relative block w-full h-44 bg-gray-100 text-left">
                <FotoPrestasi p={p} />
                <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow ${WARNA_TINGKAT[p.tingkat] || 'bg-gray-600'}`}>{p.tingkat}</span>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">{p.lingkup}</span>
              </button>
              <div className="p-3 flex-1 text-sm">
                <p className="font-bold text-gray-800 leading-snug">{p.judul}</p>
                {p.peringkat && <p className="text-xs font-semibold mt-1"><i className={`fas fa-medal mr-1 ${warnaMedali(p.peringkat)}`}></i>{p.peringkat}</p>}
                <p className="text-xs text-gray-600 mt-1"><i className="fas fa-user-graduate mr-1 text-gray-400"></i>{p.namaSiswa}{p.kelas ? ` • ${p.kelas}` : ''}</p>
                <p className="text-[11px] text-gray-400 mt-1">{tanggalPanjang(p.tanggal)}</p>
              </div>
              {bisaKelola && (
                <div className="flex border-t text-xs">
                  <button onClick={() => setForm({ ...FORM_KOSONG(), ...p })} className="flex-1 py-2 text-yellow-700 hover:bg-yellow-50"><i className="fas fa-edit"></i> Ubah</button>
                  <button onClick={() => hapus(p)} className="flex-1 py-2 text-red-600 hover:bg-red-50 border-l"><i className="fas fa-trash"></i> Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DETAIL */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? detail.judul : ''} size="max-w-2xl">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="w-full max-h-[55vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {detail.foto ? <img src={fotoBesar(detail.foto)} alt={detail.judul} className="max-h-[55vh] w-auto object-contain" /> : <div className="w-full h-48"><FotoPrestasi p={detail} /></div>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${WARNA_TINGKAT[detail.tingkat] || 'bg-gray-600'}`}>{detail.tingkat}</span>
              <span className="text-[11px] font-semibold bg-gray-200 px-2 py-0.5 rounded-full">{detail.lingkup}</span>
              {detail.peringkat && <span className="text-[11px] font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full"><i className={`fas fa-medal mr-1 ${warnaMedali(detail.peringkat)}`}></i>{detail.peringkat}</span>}
            </div>
            <p><b>{detail.namaSiswa}</b>{detail.kelas ? ` — ${detail.kelas}` : ''}</p>
            {detail.penyelenggara && <p className="text-gray-600"><i className="fas fa-building mr-1 text-gray-400"></i>{detail.penyelenggara}</p>}
            <p className="text-gray-500"><i className="far fa-calendar mr-1"></i>{tanggalPanjang(detail.tanggal)}</p>
            {detail.deskripsi && <p className="text-gray-700 whitespace-pre-line">{detail.deskripsi}</p>}
          </div>
        )}
      </Modal>

      {/* FORM (hanya admin) */}
      {bisaKelola && (
        <Modal isOpen={!!form} onClose={() => setForm(null)} title={form && form.id ? 'Ubah Prestasi' : 'Tambah Prestasi'} size="max-w-xl">
          {form && (
            <form onSubmit={simpan} className="space-y-3 text-sm">
              <div><label className="text-xs font-semibold text-gray-600">Nama Prestasi / Kegiatan</label>
                <input name="judul" required value={form.judul} onChange={ubah} className="w-full border p-2 rounded mt-1" placeholder="Cth: Lomba Mewarnai Tingkat Kecamatan" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-600">Nama Siswa</label>
                  <input name="namaSiswa" required list="daftar-siswa-prestasi" value={form.namaSiswa} onChange={pilihNama} className="w-full border p-2 rounded mt-1" placeholder="Ketik / pilih siswa" />
                  <datalist id="daftar-siswa-prestasi">{DB.rows('Siswa').map((s) => <option key={s.id} value={s.nama} />)}</datalist></div>
                <div><label className="text-xs font-semibold text-gray-600">Kelas</label>
                  <input name="kelas" value={form.kelas} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
                <div><label className="text-xs font-semibold text-gray-600">Lingkup</label>
                  <select name="lingkup" value={form.lingkup} onChange={ubah} className="w-full border p-2 rounded mt-1">{LINGKUP_PRESTASI.map((l) => <option key={l}>{l}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-600">Tingkat</label>
                  <select name="tingkat" value={form.tingkat} onChange={ubah} className="w-full border p-2 rounded mt-1">{TINGKAT_PRESTASI.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-gray-600">Peringkat / Juara</label>
                  <input name="peringkat" value={form.peringkat} onChange={ubah} className="w-full border p-2 rounded mt-1" placeholder="Cth: Juara 1" /></div>
                <div><label className="text-xs font-semibold text-gray-600">Tanggal</label>
                  <input name="tanggal" type="date" required value={form.tanggal} onChange={ubah} className="w-full border p-2 rounded mt-1" /></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-600">Penyelenggara</label>
                <input name="penyelenggara" value={form.penyelenggara} onChange={ubah} className="w-full border p-2 rounded mt-1" placeholder="Cth: Dinas Pendidikan Kab. Karawang" /></div>
              <div><label className="text-xs font-semibold text-gray-600">Keterangan</label>
                <textarea name="deskripsi" rows="3" value={form.deskripsi} onChange={ubah} className="w-full border p-2 rounded mt-1"></textarea></div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Foto Kegiatan / Piala</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-24 h-16 rounded overflow-hidden border bg-gray-100 shrink-0"><FotoPrestasi p={form} /></div>
                  <input type="file" accept="image/*" onChange={unggahFoto} className="text-xs w-full" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={proses} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white p-2.5 rounded font-bold">{proses ? 'Memproses…' : 'Simpan Prestasi'}</button>
                <button type="button" onClick={() => setForm(null)} className="bg-gray-400 text-white px-4 rounded">Batal</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

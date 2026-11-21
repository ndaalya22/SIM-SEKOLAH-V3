// ===== Modul Akademik: Data Siswa, Data Guru, Nilai, Leger, Rapor, Kelulusan =====

// Daftar lulusan = siswa kelas 6 / berstatus Lulus, digabung dengan nilai & nomor ijazah (tabel Lulusan).
const useLulusan = () => {
  const DB = useDB();
  const siswa = DB.rows('Siswa');
  const lulus = DB.rows('Lulusan');
  return useMemo(() => {
    const peta = {};
    const ttlDari = (s) => [s.tempatLahir, tanggalPanjang(s.tglLahir)].filter(Boolean).join(', ');
    siswa.filter((s) => tingkatDariKelas(s.kelas) === 6 || s.status === 'Lulus').forEach((s) => {
      peta[s.nisn] = { id: '', nisn: s.nisn, nis: s.nis, nama: s.nama, ttl: ttlDari(s), noIjazah: '', tglIjazah: '', tulis: 0, praktek: 0, tka: 0, foto: s.foto };
    });
    lulus.forEach((l) => {
      const s = siswa.find((x) => x.nisn === l.nisn);
      const dasar = peta[l.nisn] || { nisn: l.nisn, nis: s ? s.nis : '', nama: l.nama, ttl: s ? ttlDari(s) : '', foto: s ? s.foto : '' };
      peta[l.nisn] = { ...dasar, id: l.id, noIjazah: l.noIjazah, tglIjazah: l.tglIjazah, tulis: l.tulis, praktek: l.praktek, tka: l.tka };
    });
    return Object.values(peta).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [siswa, lulus]);
};

const InputNilaiIjazah = () => {
  const DB = useDB();
  const lulusanList = useLulusan();
  const [proses, jalankan] = useAksi();
  const [nisn, setNisn] = useState('');
  const [form, setForm] = useState({ tulis: 0, praktek: 0, tka: 0, noIjazah: '', tglIjazah: '' });

  useEffect(() => {
    if (!lulusanList.some((s) => s.nisn === nisn)) setNisn(lulusanList[0] ? lulusanList[0].nisn : '');
  }, [lulusanList]);

  useEffect(() => {
    const s = lulusanList.find((x) => x.nisn === nisn);
    if (s) setForm({ tulis: s.tulis, praktek: s.praktek, tka: s.tka, noIjazah: s.noIjazah || '', tglIjazah: /^\d{4}-/.test(s.tglIjazah) ? s.tglIjazah : '' });
  }, [nisn, lulusanList]);

  const simpan = (e) => {
    e.preventDefault();
    const s = lulusanList.find((x) => x.nisn === nisn);
    if (!s) return showAlert('Pilih siswa terlebih dahulu.', 'error');
    jalankan(async () => {
      await DB.simpan('Lulusan', { id: s.id, nisn, nama: s.nama, noIjazah: form.noIjazah, tglIjazah: form.tglIjazah,
        tulis: Number(form.tulis), praktek: Number(form.praktek), tka: Number(form.tka) });
      showAlert(`Nilai ijazah ${s.nama} tersimpan dan siap dicetak di transkrip.`);
    });
  };

  const ubah = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const inputNilai = 'w-full border p-2.5 rounded mt-1 text-lg font-bold text-blue-800 text-center';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      <div className="border-b pb-4">
        <h3 className="font-bold text-gray-700 text-lg"><i className="fas fa-file-signature text-blue-600"></i> Modul Input Komponen Nilai Ijazah</h3>
        <p className="text-xs text-gray-500 mt-1">Data yang diinput di sini langsung terhubung ke modul Arsip & Cetak Transkrip Lulusan.</p>
      </div>

      {lulusanList.length === 0 ? <KosongInfo teks="Belum ada calon lulusan. Siswa kelas 6 otomatis muncul di sini setelah kelasnya diatur di Data Siswa." /> : (
        <form onSubmit={simpan} className="max-w-2xl bg-blue-50/30 p-6 rounded-lg border border-blue-100 space-y-5">
          <div>
            <label className="text-sm font-bold text-gray-700">Pilih Siswa Kelas 6 (Calon Lulusan)</label>
            <select value={nisn} onChange={(e) => setNisn(e.target.value)} className="w-full border p-2 rounded mt-1 font-semibold bg-white">
              {lulusanList.map((s) => <option key={s.nisn} value={s.nisn}>{s.nama}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-blue-200">
            <div><label className="text-sm font-semibold text-gray-600">Nilai Ujian Tulis</label><input required type="number" min="0" max="100" step="0.1" value={form.tulis} onChange={ubah('tulis')} className={inputNilai} /></div>
            <div><label className="text-sm font-semibold text-gray-600">Nilai Ujian Praktek</label><input required type="number" min="0" max="100" step="0.1" value={form.praktek} onChange={ubah('praktek')} className={inputNilai} /></div>
            <div><label className="text-sm font-semibold text-gray-600">Nilai TKA</label><input required type="number" min="0" max="100" step="0.1" value={form.tka} onChange={ubah('tka')} className={inputNilai} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-blue-200">
            <div><label className="text-sm font-semibold text-gray-600">Nomor Seri Ijazah</label><input value={form.noIjazah} onChange={ubah('noIjazah')} placeholder="DN-01/D-SD/2026/0012345" className="w-full border p-2 rounded mt-1 text-sm" /></div>
            <div><label className="text-sm font-semibold text-gray-600">Tanggal Ijazah</label><input type="date" value={form.tglIjazah} onChange={ubah('tglIjazah')} className="w-full border p-2 rounded mt-1 text-sm" /></div>
          </div>
          <button type="submit" disabled={proses} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-3 rounded font-bold shadow-md">
            {proses ? 'Menyimpan…' : 'Simpan Nilai ke Transkrip Ijazah'}
          </button>
        </form>
      )}
    </div>
  );
};


const DataSiswa = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const siswaList = DB.rows('Siswa');
  const rombelList = DB.rows('Rombel');
  const [proses, jalankan] = useAksi();
  const [modalOpen, setModalOpen] = useState(false);
  const [cetakModalOpen, setCetakModalOpen] = useState(false);
  const [selectedSiswaCetak, setSelectedSiswaCetak] = useState(null);
  const [cari, setCari] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  const KOSONG = { id: '', nisn: '', nis: '', nik: '', nama: '', jk: '', tempatLahir: '', tglLahir: '', kk: '', namaAyah: '', namaIbu: '', alamat: '',
                   kelas: '', tglMasuk: '', tahunAjaran: sekolah.tahunAjaran || '', status: 'Aktif', foto: '' };
  const [formData, setFormData] = useState(KOSONG);

  const tersaring = siswaList.filter((s) => {
    const q = cari.trim().toLowerCase();
    const cocokCari = !q || s.nama.toLowerCase().includes(q) || String(s.nisn).includes(q);
    const cocokKelas = !filterKelas || (filterKelas === '__none__' ? !s.kelas : s.kelas === filterKelas);
    return cocokCari && cocokKelas;
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'foto');
      setFormData((f) => ({ ...f, foto: hasil.url }));
      showAlert('Foto siswa berhasil diunggah ke Drive.');
    });
  };

  const simpanSiswa = (e) => {
    e.preventDefault();
    jalankan(async () => {
      await DB.simpan('Siswa', formData);
      showAlert(formData.id ? 'Data siswa diperbarui.' : 'Data siswa baru berhasil disimpan.');
      setModalOpen(false);
    });
  };

  const handleTambahSiswa = () => { setFormData({ ...KOSONG, tahunAjaran: sekolah.tahunAjaran || '' }); setModalOpen(true); };
  const handleEditSiswa = (siswa) => { setFormData({ ...KOSONG, ...siswa }); setModalOpen(true); };
  const hapusSiswa = (siswa) => {
    if (confirm(`Hapus data siswa ${siswa.nama}? Tindakan ini tidak dapat dibatalkan.`))
      jalankan(async () => { await DB.hapus('Siswa', siswa.id); showAlert('Data siswa dihapus.'); });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / NISN…" className="border p-2 rounded text-sm w-52" />
          <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="border p-2 rounded text-sm bg-white">
            <option value="">Semua kelas</option>
            {rombelList.map((r) => <option key={r.id} value={r.kelas}>{r.kelas}</option>)}
            <option value="__none__">Belum berkelas</option>
          </select>
          <span className="text-xs text-gray-500">{tersaring.length} dari {siswaList.length} siswa</span>
        </div>
        <button onClick={handleTambahSiswa} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
          <i className="fas fa-plus"></i> Tambah Siswa
        </button>
      </div>
      
      {/* 5. Tabel Mapping Data SiswaList */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-16 text-center">Foto</th>
              <th className="px-6 py-3">NISN / NIK</th>
              <th className="px-6 py-3">Nama Lengkap</th>
              <th className="px-6 py-3">Kelas</th>
              <th className="px-6 py-3">Orang Tua (Ayah / Ibu)</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tersaring.map((siswa) => (
              <tr key={siswa.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-center">
                  <img src={siswa.foto || FOTO_KOSONG} alt="Thumbnail" className="w-10 h-12 object-cover rounded border mx-auto shadow-sm" />
                </td>
                <td className="px-6 py-4">{siswa.nisn}</td>
                <td className="px-6 py-4 font-semibold">{siswa.nama}</td>
                <td className="px-6 py-4 text-xs">{siswa.kelas || <span className="text-gray-400 italic">belum berkelas</span>}</td>
                <td className="px-6 py-4">{siswa.namaAyah} / {siswa.namaIbu}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => handleEditSiswa(siswa)} className="text-yellow-600 border border-yellow-200 p-2 rounded hover:bg-yellow-50" title="Ubah"><i className="fas fa-edit"></i></button>
                  <button onClick={() => { setSelectedSiswaCetak(siswa); setCetakModalOpen(true); }} className="text-blue-600 border border-blue-200 p-2 rounded hover:bg-blue-50" title="Cetak Biodata"><i className="fas fa-print"></i></button>
                  <button onClick={() => hapusSiswa(siswa)} className="text-red-600 border border-red-200 p-2 rounded hover:bg-red-50" title="Hapus"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tersaring.length === 0 && <KosongInfo teks="Belum ada data siswa yang cocok." />}
      </div>

      {/* MODAL INPUT/EDIT LENGKAP */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={formData.id ? "Edit Data Siswa" : "Form Data Induk Siswa Baru"} size="max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={simpanSiswa} className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <h4 className="font-semibold text-gray-700 border-b pb-1">Unggah Foto Siswa</h4>
            <div className="flex items-center gap-4 bg-gray-50 p-3 border rounded">
              <img src={formData.foto || FOTO_KOSONG} alt="Preview" className="w-16 h-20 object-cover border rounded shadow" />
              <div>
                <input type="file" accept="image/*" onChange={handleFotoUpload} className="text-xs w-full" />
                <p className="text-[10px] text-gray-500 mt-1">Format: JPG, PNG (Rekomendasi 3x4)</p>
              </div>
            </div>

            <h4 className="font-semibold text-gray-700 border-b pb-1 pt-2">Identitas Diri Siswa</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">NISN</label><input name="nisn" value={formData.nisn} onChange={handleChange} required className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">NIK Siswa</label><input name="nik" value={formData.nik} onChange={handleChange} required className="w-full border p-2 rounded text-sm"/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">NIS</label><input name="nis" value={formData.nis} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Jenis Kelamin</label>
                <select name="jk" value={formData.jk} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white"><option value="">-- Pilih --</option><option>Laki-laki</option><option>Perempuan</option></select></div>
              <div><label className="text-xs text-gray-600">Kelas / Rombel</label>
                <select name="kelas" value={formData.kelas} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white"><option value="">-- Belum berkelas --</option>{rombelList.map((r) => <option key={r.id} value={r.kelas}>{r.kelas}</option>)}</select></div>
              <div><label className="text-xs text-gray-600">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded text-sm bg-white"><option>Aktif</option><option>Nonaktif</option><option>Pindah</option><option>Lulus</option></select></div>
            </div>
            <div><label className="text-xs text-gray-600">Nama Lengkap</label><input name="nama" value={formData.nama} onChange={handleChange} required className="w-full border p-2 rounded text-sm"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">Tempat Lahir</label><input name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Tanggal Lahir</label><input name="tglLahir" value={formData.tglLahir} onChange={handleChange} type="date" className="w-full border p-2 rounded text-sm"/></div>
            </div>
            <div><label className="text-xs text-gray-600">Alamat Tempat Tinggal</label><textarea name="alamat" rows="2" value={formData.alamat} onChange={handleChange} className="w-full border p-2 rounded text-sm"></textarea></div>

            <h4 className="font-semibold text-gray-700 border-b pb-1 pt-2">Keluarga (Ayah / Ibu / KK)</h4>
            <div><label className="text-xs text-gray-600">Nomor Kartu Keluarga (KK)</label><input name="kk" value={formData.kk} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">Nama Ayah</label><input name="namaAyah" value={formData.namaAyah} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Nama Ibu</label><input name="namaIbu" value={formData.namaIbu} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
            </div>

            <h4 className="font-semibold text-gray-700 border-b pb-1 pt-2">Keterangan Akademik Sekolah</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">Tanggal Masuk Sekolah</label><input name="tglMasuk" value={formData.tglMasuk} onChange={handleChange} type="date" className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Tahun Ajaran Masuk</label><input name="tahunAjaran" value={formData.tahunAjaran} onChange={handleChange} className="w-full border p-2 rounded text-sm" placeholder="2026/2027"/></div>
            </div>

            <button type="submit" disabled={proses} className="w-full bg-green-600 disabled:opacity-60 text-white p-3 rounded font-bold mt-4 shadow-sm hover:bg-green-700">{proses ? 'Menyimpan…' : 'Simpan Data Lengkap'}</button>
          </form>

          {/* SISI KANAN: LIVE PRATINJAU KERTAS */}
          <div className="bg-gray-200 p-4 rounded flex justify-center items-start overflow-y-auto">
            <div className="bg-white w-full max-w-[420px] p-6 shadow-md font-serif text-xs relative border space-y-3">
              <h3 className="text-center font-bold text-sm underline tracking-wide">BIODATA PESERTA DIDIK</h3>
              <div className="flex justify-center my-2">
                <img src={formData.foto || FOTO_KOSONG} alt="Foto" className="w-20 h-24 object-cover border p-0.5 shadow-sm" />
              </div>
              <table className="w-full leading-relaxed space-y-1">
                <tbody>
                  <tr><td className="w-1/3 py-0.5 font-semibold">Nama</td><td>:</td><td className="font-bold">{formData.nama}</td></tr>
                  <tr><td className="py-0.5 font-semibold">NISN / NIK</td><td>:</td><td>{formData.nisn} / {formData.nik}</td></tr>
                  <tr><td className="py-0.5 font-semibold">TTL</td><td>:</td><td>{formData.tempatLahir}, {formData.tglLahir}</td></tr>
                  <tr><td className="py-0.5 font-semibold">Alamat</td><td>:</td><td>{formData.alamat}</td></tr>
                  <tr><td className="py-0.5 font-semibold">No. KK</td><td>:</td><td>{formData.kk}</td></tr>
                  <tr><td className="py-0.5 font-semibold">Nama Ayah</td><td>:</td><td>{formData.namaAyah}</td></tr>
                  <tr><td className="py-0.5 font-semibold">Nama Ibu</td><td>:</td><td>{formData.namaIbu}</td></tr>
                  <tr><td className="py-0.5 font-semibold">Tgl Masuk</td><td>:</td><td>{formData.tglMasuk} (TA: {formData.tahunAjaran})</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL CETAK BIODATA RESMI A4 */}
      <Modal isOpen={cetakModalOpen} onClose={() => setCetakModalOpen(false)} title="Cetak Lembar Biodata Resmi Siswa" size="max-w-4xl">
        {selectedSiswaCetak && (
          <div className="space-y-4">
            <div id="printable-a4-area" className="bg-white w-full max-w-[700px] mx-auto p-12 shadow-md font-serif text-xs relative border text-black space-y-6">
              <div className="flex items-center border-b-4 border-double border-black pb-4 mb-4">
                <img src={sekolah.logoUrl} alt="Logo Yayasan Annihayah" className="w-20 h-20 object-contain" />
                <div className="flex-1 text-center pr-20">
                  <h2 className="font-bold text-sm tracking-widest text-green-800">YAYASAN ANNIHAYAH</h2>
                  <h1 className="font-extrabold text-xl mt-0.5 text-green-900 tracking-wide">SDIT ANNIHAYAH</h1>
                  <p className="text-[10px] text-gray-800 mt-1 font-medium">{sekolah.alamat}</p>
                </div>
              </div>
              <div className="flex justify-between items-start gap-4">
                <table className="w-3/4 leading-relaxed">
                  <tbody>
                    <tr><td className="w-2/5 py-1.5 font-semibold">1. Nama Lengkap</td><td className="w-4">:</td><td className="font-bold">{selectedSiswaCetak.nama}</td></tr>
                    <tr><td className="py-1.5 font-semibold">2. NISN</td><td>:</td><td>{selectedSiswaCetak.nisn}</td></tr>
                    <tr><td className="py-1.5 font-semibold">3. NIK Siswa</td><td>:</td><td>{selectedSiswaCetak.nik}</td></tr>
                    <tr><td className="py-1.5 font-semibold">4. Tempat, Tanggal Lahir</td><td>:</td><td>{selectedSiswaCetak.tempatLahir}, {selectedSiswaCetak.tglLahir}</td></tr>
                    <tr><td className="py-1.5 font-semibold">5. Alamat Tempat Tinggal</td><td>:</td><td>{selectedSiswaCetak.alamat}</td></tr>
                    <tr><td colSpan="3" className="pt-3 pb-1 font-bold">Keterangan Keluarga / Orang Tua</td></tr>
                    <tr><td className="py-1.5 font-semibold">6. Nomor Kartu Keluarga (KK)</td><td>:</td><td>{selectedSiswaCetak.kk}</td></tr>
                    <tr><td className="py-1.5 font-semibold">7. Nama Ayah Kandung</td><td>:</td><td>{selectedSiswaCetak.namaAyah}</td></tr>
                    <tr><td className="py-1.5 font-semibold">8. Nama Ibu Kandung</td><td>:</td><td>{selectedSiswaCetak.namaIbu}</td></tr>
                    <tr><td colSpan="3" className="pt-3 pb-1 font-bold">Keterangan Akademik Sekolah</td></tr>
                    <tr><td className="py-1.5 font-semibold">9. Tanggal Masuk Sekolah</td><td>:</td><td>{selectedSiswaCetak.tglMasuk}</td></tr>
                    <tr><td className="py-1.5 font-semibold">10. Tahun Ajaran Masuk</td><td>:</td><td>{selectedSiswaCetak.tahunAjaran}</td></tr>
                  </tbody>
                </table>
                <div className="flex flex-col items-center">
                  <img src={selectedSiswaCetak.foto || FOTO_KOSONG} alt="Foto Siswa" className="w-24 h-32 object-cover border p-1 shadow" />
                  <span className="text-[9px] text-gray-500 mt-1">Pas foto 3x4</span>
                </div>
              </div>
              <div className="mt-12 flex justify-between items-end pt-6">
                <div className="text-center">
                  <p>Mengetahui,</p>
                  <p>Orang Tua / Wali Siswa,</p>
                  <br/><br/><br/>
                  <p className="underline font-bold">( ................................... )</p>
                </div>
                <div className="text-center">
                  <p>{sekolah.kota}, {tanggalHariIni()}</p>
                  <p>Kepala SDIT Annihayah,</p>
                  <br/><br/><br/>
                  <p className="font-bold underline"><NamaTtd nama={sekolah.kepsek} maks="80mm" /></p>
                  <p>NIP. {sekolah.nipKepsek || '-'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4 no-print">
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold">
                <i className="fas fa-print"></i> Cetak PDF A4 Biodata Lengkap
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const DataGuru = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const guruList = DB.rows('Guru');
  const rombelList = DB.rows('Rombel');
  const [proses, jalankan] = useAksi();
  const [modalOpen, setModalOpen] = useState(false);
  const [cetakModalOpen, setCetakModalOpen] = useState(false);
  const KOSONG = { id: '', nip: '', nama: '', tempatLahir: '', tglLahir: '', pendidikan: '', alamat: '', email: '', hp: '', foto: '' };
  const [formData, setFormData] = useState(KOSONG);

  // Tugas dideteksi otomatis dari data Rombel
  const getTugasGuru = (namaGuru) => {
    const rombel = rombelList.find((r) => r.wali === namaGuru);
    return rombel ? `Wali Kelas ${rombel.kelas}` : 'Guru Mata Pelajaran / Bidang Studi';
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'foto');
      setFormData((f) => ({ ...f, foto: hasil.url }));
      showAlert('Foto guru berhasil diunggah ke Drive.');
    });
  };

  const simpanGuru = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) return showAlert('Nama guru wajib diisi.', 'error');
    jalankan(async () => {
      await DB.simpan('Guru', formData);
      showAlert(formData.id ? 'Data guru berhasil diperbarui.' : 'Data guru baru berhasil ditambahkan.');
      setModalOpen(false);
    });
  };

  const hapusGuru = (guru) => {
    if (rombelList.some((r) => r.wali === guru.nama)) return showAlert(`${guru.nama} masih menjadi wali kelas. Ganti wali kelasnya dulu di Pengaturan → Rombel.`, 'error');
    if (confirm(`Hapus data guru ${guru.nama}?`)) jalankan(async () => { await DB.hapus('Guru', guru.id); showAlert('Data guru dihapus.'); });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <button onClick={() => { setFormData(KOSONG); setModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
          <i className="fas fa-plus"></i> Tambah Data Guru
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-16 text-center">Foto</th>
              <th className="px-6 py-3">Nama Lengkap & Gelar</th>
              <th className="px-6 py-3">Pendidikan</th>
              <th className="px-6 py-3">Kontak</th>
              <th className="px-6 py-3">Tugas (Terintegrasi Otomatis)</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {guruList.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-center"><img src={g.foto || FOTO_KOSONG} alt="Thumbnail" className="w-10 h-12 object-cover rounded border mx-auto shadow-sm" /></td>
                <td className="px-6 py-4 font-semibold">{g.nama}</td>
                <td className="px-6 py-4">{g.pendidikan}</td>
                <td className="px-6 py-4">{g.hp} <br/><span className="text-xs text-gray-500">{g.email}</span></td>
                <td className="px-6 py-4">
                  {/* Tugas Tampil Otomatis Berdasarkan Deteksi Rombel */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTugasGuru(g.nama).includes('Wali Kelas') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {getTugasGuru(g.nama)}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => { setFormData({ ...KOSONG, ...g }); setModalOpen(true); }} className="text-yellow-600 border border-yellow-200 p-2 rounded hover:bg-yellow-50"><i className="fas fa-edit"></i></button>
                  <button onClick={() => { setFormData(g); setCetakModalOpen(true); }} className="text-blue-600 border border-blue-200 p-2 rounded hover:bg-yellow-50"><i className="fas fa-print"></i></button>
                  <button onClick={() => hapusGuru(g)} className="text-red-600 border border-red-200 p-2 rounded hover:bg-red-50" title="Hapus"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {guruList.length === 0 && <KosongInfo teks="Belum ada data guru." />}
      </div>

      {/* MODAL FORM INPUT & PRATINJAU KANAN */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Form Data Guru & Live Pratinjau Biodata" size="max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={simpanGuru} className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
            <h4 className="font-semibold text-gray-700 border-b pb-1">Unggah Foto Guru</h4>
            <div className="flex items-center gap-4 bg-gray-50 p-3 border rounded">
              <img src={formData.foto || FOTO_KOSONG} alt="Preview" className="w-16 h-20 object-cover border rounded shadow" />
              <div><input type="file" accept="image/*" onChange={handleFotoUpload} className="text-xs w-full" /></div>
            </div>

            <h4 className="font-semibold text-gray-700 border-b pb-1 pt-2">Identitas & Kependidikan</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">NIP / NIY</label><input name="nip" value={formData.nip} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Pendidikan Terakhir</label><input name="pendidikan" value={formData.pendidikan} onChange={handleChange} required className="w-full border p-2 rounded text-sm"/></div>
            </div>
            <div><label className="text-xs text-gray-600">Nama Lengkap & Gelar</label><input name="nama" value={formData.nama} onChange={handleChange} required className="w-full border p-2 rounded text-sm"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">Tempat Lahir</label><input name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Tanggal Lahir</label><input name="tglLahir" value={formData.tglLahir} onChange={handleChange} type="date" className="w-full border p-2 rounded text-sm"/></div>
            </div>

            <h4 className="font-semibold text-gray-700 border-b pb-1 pt-2">Kontak & Penugasan</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-600">No HP / WA</label><input name="hp" value={formData.hp} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
              <div><label className="text-xs text-gray-600">Email Aktif</label><input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded text-sm"/></div>
            </div>
            <div><label className="text-xs text-gray-600">Alamat Lengkap</label><textarea name="alamat" rows="2" value={formData.alamat} onChange={handleChange} className="w-full border p-2 rounded text-sm"></textarea></div>
            
            {/* Field Penugasan kini Otomatis Read-Only */}
            <div>
              <label className="text-xs text-gray-600">Penugasan (Dideteksi Otomatis dari Kelola Rombel)</label>
              <input readOnly value={getTugasGuru(formData.nama)} className="w-full border p-2 rounded text-sm bg-gray-100 font-semibold text-gray-600 cursor-not-allowed"/>
            </div>

            <button type="submit" disabled={proses} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-3 rounded font-bold mt-4 shadow-sm">{proses ? 'Menyimpan…' : 'Simpan Data Guru'}</button>
          </form>

          {/* SISI KANAN: LIVE PRATINJAU */}
          <div className="bg-gray-200 p-4 rounded flex justify-center items-start overflow-y-auto">
            <div className="bg-white w-full max-w-[420px] p-6 shadow-md font-serif text-xs relative border space-y-3">
              <div className="text-center border-b pb-2"><h3 className="font-bold text-sm uppercase tracking-wide">BIODATA PENDIDIK</h3><p className="text-[9px] text-gray-600">SDIT ANNIHAYAH</p></div>
              <div className="flex justify-center my-2"><img src={formData.foto || FOTO_KOSONG} alt="Foto Guru" className="w-20 h-24 object-cover border p-0.5 shadow-sm rounded" /></div>
              <table className="w-full leading-relaxed space-y-1">
                <tbody>
                  <tr><td className="w-2/5 py-1 font-semibold">Nama & Gelar</td><td>:</td><td className="font-bold">{formData.nama || '................................'}</td></tr>
                  <tr><td className="py-1 font-semibold">NIP / NIY</td><td>:</td><td>{formData.nip || '-'}</td></tr>
                  <tr><td className="py-1 font-semibold">TTL</td><td>:</td><td>{formData.tempatLahir}, {formData.tglLahir}</td></tr>
                  <tr><td className="py-1 font-semibold">Pendidikan</td><td>:</td><td>{formData.pendidikan}</td></tr>
                  <tr><td className="py-1 font-semibold">No. HP / WA</td><td>:</td><td>{formData.hp}</td></tr>
                  <tr><td className="py-1 font-semibold">Penugasan</td><td>:</td><td className="font-bold text-green-700">{getTugasGuru(formData.nama)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL CETAK BIODATA GURU RESMI A4 */}
      <Modal isOpen={cetakModalOpen} onClose={() => setCetakModalOpen(false)} title="Cetak Lembar Biodata Resmi Guru" size="max-w-4xl">
        {formData && (
          <div className="space-y-4">
            <div id="printable-a4-area" className="bg-white w-full max-w-[700px] mx-auto p-12 shadow-md font-serif text-xs relative border text-black space-y-6">
              <div className="text-center border-b-2 border-black pb-3">
                <h2 className="font-bold text-sm uppercase tracking-wider">YAYASAN ANNIHAYAH - SDIT ANNIHAYAH</h2>
                <h1 className="font-extrabold text-lg mt-1 underline">LEMBAR INDUK BIODATA PENDIDIK (GURU)</h1>
              </div>
              <div className="flex justify-between items-start gap-4">
                <table className="w-3/4 leading-relaxed">
                  <tbody>
                    <tr><td className="w-2/5 py-2 font-semibold">1. Nama Lengkap & Gelar</td><td className="w-4">:</td><td className="font-bold">{formData.nama}</td></tr>
                    <tr><td className="py-2 font-semibold">2. NIP / NIY</td><td>:</td><td>{formData.nip}</td></tr>
                    <tr><td className="py-2 font-semibold">3. Tempat, Tanggal Lahir</td><td>:</td><td>{formData.tempatLahir}, {formData.tglLahir}</td></tr>
                    <tr><td className="py-2 font-semibold">4. Kependidikan Terakhir</td><td>:</td><td>{formData.pendidikan}</td></tr>
                    <tr><td className="py-2 font-semibold">5. Alamat Tempat Tinggal</td><td>:</td><td>{formData.alamat}</td></tr>
                    <tr><td className="py-2 font-semibold">6. Nomor HP / WA</td><td>:</td><td>{formData.hp}</td></tr>
                    <tr><td className="py-2 font-semibold">7. Penugasan</td><td>:</td><td className="font-bold">{getTugasGuru(formData.nama)}</td></tr>
                  </tbody>
                </table>
                <div className="flex flex-col items-center">
                  <img src={formData.foto || FOTO_KOSONG} alt="Foto Guru" className="w-24 h-32 object-cover border p-1 shadow" />
                </div>
              </div>
              <div className="mt-16 flex justify-end pt-6">
                <div className="text-center">
                  <p>{sekolah.kota}, {tanggalHariIni()}</p>
                  <p>Kepala SDIT Annihayah,</p><br/><br/><br/>
                  <p className="font-bold underline"><NamaTtd nama={sekolah.kepsek} maks="100mm" /></p>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t pt-4 no-print">
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold">
                <i className="fas fa-print"></i> Cetak PDF A4 Biodata Guru
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const InputNilai = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const [proses, jalankan] = useAksi();
  const rombelList = DB.rows('Rombel');
  const siswaAll = DB.rows('Siswa');
  const mapelList = [...DB.rows('Mapel')].sort((a, b) => a.urutan - b.urutan);
  const nilaiRows = DB.rows('Nilai_Rapor');
  const cptpRows = DB.rows('CP_TP');
  const kelasOptions = rombelList.map((r) => r.kelas);

  const [selectedKelas, setSelectedKelas] = useState(kelasOptions[0] || '');
  const [selectedSiswa, setSelectedSiswa] = useState('');   // berisi NISN
  const [selectedPeriode, setSelectedPeriode] = useState(PERIODE_NILAI[0]);
  const [daftarNilaiMapel, setDaftarNilaiMapel] = useState([]);

  const filteredSiswa = siswaAll.filter((s) => s.kelas === selectedKelas);
  useEffect(() => {
    if (!filteredSiswa.some((s) => s.nisn === selectedSiswa)) setSelectedSiswa(filteredSiswa[0] ? filteredSiswa[0].nisn : '');
  }, [selectedKelas, siswaAll]);

  const currentSiswaData = siswaAll.find((s) => s.nisn === selectedSiswa) || { nama: '-', nisn: '-', nis: '' };
  const rombel = rombelList.find((r) => r.kelas === selectedKelas);
  const waliGuru = DB.rows('Guru').find((g) => rombel && g.nama === rombel.wali);
  const catatanRapor = DB.rows('Catatan_Rapor').find((c) => c.nisn === selectedSiswa && c.semester === semesterDariPeriode(selectedPeriode));

  // Isi tabel dari database; bila belum ada nilai, capaian diisi dari CP/TP
  useEffect(() => {
    setDaftarNilaiMapel(mapelList.map((m) => {
      const ada = nilaiRows.find((x) => x.nisn === selectedSiswa && x.periode === selectedPeriode && x.mapel === m.nama);
      const tp = cptpRows.find((c) => c.kelas === selectedKelas && c.mapel === m.nama);
      return { id: m.id, mapel: m.nama, nilai: ada ? ada.nilai : '', capaian: ada ? ada.capaian : (tp ? tp.deskripsi : '') };
    }));
  }, [selectedSiswa, selectedPeriode, selectedKelas, DB.rows('Mapel'), DB.rows('Nilai_Rapor'), DB.rows('CP_TP')]);

  const handleMapelChange = (index, field, value) =>
    setDaftarNilaiMapel((list) => list.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const handleSimpanSemua = () => {
    if (!selectedSiswa) return showAlert('Pilih siswa terlebih dahulu.', 'error');
    const items = daftarNilaiMapel.filter((it) => it.nilai !== '' && it.nilai !== null)
      .map((it) => ({ mapel: it.mapel, nilai: Number(it.nilai), capaian: it.capaian }));
    if (!items.length) return showAlert('Isi minimal satu nilai mata pelajaran.', 'error');
    if (items.some((it) => isNaN(it.nilai) || it.nilai < 0 || it.nilai > 100)) return showAlert('Nilai harus berupa angka 0–100.', 'error');
    jalankan(async () => {
      await DB.simpanNilaiRapor({ nisn: selectedSiswa, nama: currentSiswaData.nama, kelas: selectedKelas, periode: selectedPeriode, items });
      if (isPts && kunciPts && (String(catatanPts.catatan).trim() || catatanPts.id)) {
        await DB.simpan('Catatan_Rapor', { ...catatanPts, nisn: selectedSiswa, semester: kunciPts, catatan: String(catatanPts.catatan || '').trim(),
          sakit: Number(catatanPts.sakit) || 0, izin: Number(catatanPts.izin) || 0, alpha: Number(catatanPts.alpha) || 0 });
      }
      if (selectedPeriode.includes('Rapor Semester')) {
        await DB.simpan('Catatan_Rapor', { ...formP, nisn: selectedSiswa, semester: semesterDariPeriode(selectedPeriode),
          sakit: Number(formP.sakit) || 0, izin: Number(formP.izin) || 0, alpha: Number(formP.alpha) || 0 });
      }
      showAlert(`Nilai ${currentSiswaData.nama} (${selectedPeriode}) berhasil disimpan.`);
    });
  };

  const isRapor = selectedPeriode.includes('Rapor Semester');

  // Data pendukung rapor (catatan wali, ekskul, absensi) — muncul hanya untuk periode Rapor Semester 1 / 2
  const semesterKey = semesterDariPeriode(selectedPeriode);
  const KOSONG_P = { id: '', catatan: '', ekskul: '', predikat: '', ketEkskul: '', sakit: 0, izin: 0, alpha: 0 };
  const [formP, setFormP] = useState(KOSONG_P);
  useEffect(() => {
    const ada = DB.rows('Catatan_Rapor').find((c) => c.nisn === selectedSiswa && c.semester === semesterKey);
    setFormP(ada ? { ...KOSONG_P, ...ada } : KOSONG_P);
  }, [selectedSiswa, semesterKey, DB.rows('Catatan_Rapor')]);
  const ubahP = (k) => (e) => setFormP({ ...formP, [k]: e.target.value });

  // Catatan perkembangan untuk periode PTS 1 / PTS 2. Disimpan di Catatan_Rapor dengan kunci "PTS 1" / "PTS 2",
  // terpisah dari catatan Rapor Semester sehingga keduanya tidak saling menimpa.
  const isPts = /^PTS/.test(selectedPeriode);
  const kunciPts = (/^PTS\s*\d/.exec(selectedPeriode) || [''])[0];
  const KOSONG_PTS = { id: '', catatan: '', ekskul: '', predikat: '', ketEkskul: '', sakit: 0, izin: 0, alpha: 0 };
  const [catatanPts, setCatatanPts] = useState(KOSONG_PTS);
  useEffect(() => {
    const ada = kunciPts ? DB.rows('Catatan_Rapor').find((c) => c.nisn === selectedSiswa && c.semester === kunciPts) : null;
    setCatatanPts(ada ? { ...KOSONG_PTS, ...ada } : KOSONG_PTS);
  }, [selectedSiswa, kunciPts, DB.rows('Catatan_Rapor')]);
  const inpP = 'w-full border p-2 rounded mt-1 text-sm';

  return (
    <div className="space-y-6">
      <div className={isRapor ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start' : ''}>
      {/* Panel Form Input Utama */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-bold text-gray-700">Input Nilai Seluruh Mata Pelajaran & Capaian (CP/TP)</h3>
          <button onClick={() => window.print()} className="border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded text-sm flex items-center gap-1.5 font-medium">
            <i className="fas fa-print"></i> Cetak Dokumen A4
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-600">Pilih Kelas (Rombel)</label>
            <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white">
              {kelasOptions.map((k, i) => <option key={i} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Pilih Nama Siswa</label>
            <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white font-semibold">
              {filteredSiswa.map((s) => <option key={s.id} value={s.nisn}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Periode Penilaian</label>
            <select value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white font-bold text-green-700">
              <option value="PTS 1 (Triwulan 1)">PTS 1 (Triwulan 1)</option>
              <option value="Rapor Semester 1 (Triwulan 2)">Rapor Semester 1 (Triwulan 2)</option>
              <option value="PTS 2 (Triwulan 3)">PTS 2 (Triwulan 3)</option>
              <option value="Rapor Semester 2 (Triwulan 4)">Rapor Semester 2 (Triwulan 4)</option>
            </select>
          </div>
        </div>

        {/* Tabel Input Kolektif Semua Mapel */}
        <div className="overflow-x-auto border rounded mb-4">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 border-r w-12">No</th>
                <th className="p-3 border-r text-left">Mata Pelajaran (Terintegrasi Mapel)</th>
                <th className="p-3 border-r w-24">Nilai</th>
                <th className="p-3 border-l text-left">Capaian Kompetensi (Terintegrasi CP/TP)</th>
              </tr>
            </thead>
            <tbody>
              {daftarNilaiMapel.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-2 border-r border-b">{idx + 1}</td>
                  <td className="p-2 border-r border-b text-left font-medium">{item.mapel}</td>
                  <td className="p-2 border-r border-b">
                    <input type="number" value={item.nilai} onChange={(e) => handleMapelChange(idx, 'nilai', e.target.value)} className="w-16 border p-1 rounded text-center font-bold"/>
                  </td>
                  <td className="p-2 border-b text-left">
                    <input type="text" value={item.capaian} onChange={(e) => handleMapelChange(idx, 'capaian', e.target.value)} className="w-full border p-1 rounded text-xs"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPts && (
          <div className="mb-5 border-t pt-4 space-y-1">
            <label className="text-xs font-semibold text-gray-600"><i className="fas fa-comment-dots text-green-600 mr-1"></i> Catatan Perkembangan Siswa — {kunciPts}</label>
            <p className="text-[11px] text-gray-500">Untuk <strong>{currentSiswaData.nama}</strong>. Isian ini langsung tampil pada pratinjau dan tersimpan bersama nilai.</p>
            <textarea rows="4" maxLength={1000} value={catatanPts.catatan} onChange={(e) => setCatatanPts({ ...catatanPts, catatan: e.target.value })} placeholder="Catatan perkembangan ananda…" className="w-full border p-2 rounded mt-1 text-sm" />
            <p className="text-[10px] text-gray-400 text-right">{String(catatanPts.catatan || '').length}/1000</p>
          </div>
        )}

        <button onClick={handleSimpanSemua} disabled={proses} className="bg-blue-600 disabled:opacity-60 text-white px-5 py-2 rounded text-sm font-semibold shadow-sm hover:bg-blue-700">
          <i className="fas fa-save mr-1"></i> {isRapor ? 'Simpan Nilai & Data Pendukung' : isPts ? 'Simpan Nilai & Catatan Perkembangan' : 'Simpan Seluruh Nilai Mapel'}
        </button>
      </div>

      {isRapor && (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="pb-2 border-b">
            <h3 className="font-bold text-gray-700"><i className="fas fa-clipboard-list text-green-600"></i> Data Pendukung Rapor — {semesterKey}</h3>
            <p className="text-xs text-gray-500">Untuk <strong>{currentSiswaData.nama}</strong>. Isian ini langsung tampil pada lembar rapor di pratinjau bawah dan tersimpan bersama nilai.</p>
          </div>
          <div><label className="text-xs font-semibold text-gray-600">Catatan Wali Kelas</label><textarea rows="4" value={formP.catatan} onChange={ubahP('catatan')} placeholder="Catatan perkembangan ananda…" className={inpP} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-gray-600">Ekstrakurikuler</label><input value={formP.ekskul} onChange={ubahP('ekskul')} placeholder="Cth: MTQ / Komputer" className={inpP} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Predikat</label><input value={formP.predikat} onChange={ubahP('predikat')} placeholder="A / B / C" className={inpP} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Keterangan</label><input value={formP.ketEkskul} onChange={ubahP('ketEkskul')} className={inpP} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div><label className="text-xs font-semibold text-gray-600">Sakit (hari)</label><input type="number" min="0" value={formP.sakit} onChange={ubahP('sakit')} className={inpP} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Izin (hari)</label><input type="number" min="0" value={formP.izin} onChange={ubahP('izin')} className={inpP} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Alpha (hari)</label><input type="number" min="0" value={formP.alpha} onChange={ubahP('alpha')} className={inpP} /></div>
          </div>
          <p className="text-[11px] text-gray-500">Kolom keterangan kenaikan kelas pada rapor Semester 2 terisi otomatis sesuai tingkat kelas.</p>
        </div>
      )}
      </div>

      {isRapor ? (
        <LembarRapor sekolah={sekolah} siswa={currentSiswaData} kelas={selectedKelas} semester={selectedPeriode.replace('Rapor ', '')}
          daftarMapel={daftarNilaiMapel.map((it, i) => ({ no: i + 1, mapel: it.mapel, nilai: it.nilai === '' ? '-' : it.nilai, capai: it.capaian }))}
          pendukung={formP} wali={rombel ? rombel.wali : '...................'} waliGuru={waliGuru} />
      ) : (
      <>
      <div className="bg-gray-200 p-6 rounded-lg flex flex-col items-center">
        <h4 className="font-bold text-gray-700 mb-3 self-start"><i className="fas fa-eye text-blue-600"></i> Live Pratinjau Dokumen ({selectedPeriode})</h4>
        
        <div id="printable-a4-area" className="bg-white w-full max-w-[750px] p-10 shadow-lg font-serif text-xs leading-relaxed relative border text-black space-y-4">
          
          <div className="text-center border-b-2 border-black pb-3">
            <h2 className="font-bold text-sm uppercase tracking-wider">
              {isRapor ? 'LAPORAN HASIL BELAJAR SEMESTER' : 'LAPORAN HASIL BELAJAR SISWA TENGAH SEMESTER'}
            </h2>
            <p className="text-[10px] text-gray-700 mt-1">Satuan Pendidikan : SDIT Annihayah | Tahun Pelajaran : {sekolah.tahunAjaran}</p>
          </div>

          <div className="border border-black p-3 text-xs space-y-1 bg-gray-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-semibold">Nama Peserta Didik :</span> {currentSiswaData.nama}</div>
              <div><span className="font-semibold">Kelas :</span> {selectedKelas}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-semibold">NIS / NISN :</span> {currentSiswaData.nis ? currentSiswaData.nis + ' / ' : ''}{currentSiswaData.nisn}</div>
              <div><span className="font-semibold">Semester :</span> {selectedPeriode.includes('1') ? 'GANJIL (1)' : 'GENAP (2)'}</div>
            </div>
            <div><span className="font-semibold">Sekolah :</span> {sekolah.namaSekolah} ({sekolah.alamat})</div>
          </div>

          <div>
            <h4 className="font-bold text-xs mb-1 uppercase bg-gray-200 p-1 border border-black">B. Hasil Belajar Mata Pelajaran</h4>
            <table className="w-full text-xs border border-black">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="border border-black p-1.5 w-10">No</th>
                  <th className="border border-black p-1.5 text-left">Mata Pelajaran</th>
                  <th className="border border-black p-1.5 w-16">Nilai Akhir</th>
                  <th className="border border-black p-1.5 text-left">Capaian Kompetensi (CP/TP)</th>
                </tr>
              </thead>
              <tbody>
                {daftarNilaiMapel.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1.5 font-medium">{m.mapel}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{m.nilai}</td>
                    <td className="border border-black p-1.5">{m.capaian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-black p-3 text-xs space-y-1">
            <h4 className="font-bold uppercase">C. Catatan Perkembangan Siswa</h4>
            <p className="italic whitespace-pre-line">{String(catatanPts.catatan || '').trim() ? catatanPts.catatan : '—'}</p>
          </div>

          <div className="mt-6 flex justify-between items-end pt-2 text-xs">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p>Orang Tua/Wali,</p>
              <br/><br/><br/>
              <p className="underline font-bold">( ................................... )</p>
            </div>
            <div className="text-center">
              <p>{sekolah.kota}, {tanggalHariIni()}</p>
              <p>Wali Kelas,</p>
              <br/><br/><br/>
              <p className="font-bold underline"><NamaTtd nama={rombel ? rombel.wali : '...................'} maks="80mm" /></p>
              <p>NIP. {waliGuru && waliGuru.nip ? waliGuru.nip : '-'}</p>
            </div>
          </div>

        </div>
      </div>
      </>
      )}

    </div>
  );
};

const LegerPerKelas = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const rombelList = DB.rows('Rombel');
  const [kelas, setKelas] = useState(rombelList[0] ? rombelList[0].kelas : '');
  const siswaKelas = DB.rows('Siswa').filter((s) => s.kelas === kelas);
  const [nisn, setNisn] = useState('');
  useEffect(() => {
    if (!siswaKelas.some((s) => s.nisn === nisn)) setNisn(siswaKelas[0] ? siswaKelas[0].nisn : '');
  }, [kelas, DB.rows('Siswa')]);
  const siswa = siswaKelas.find((s) => s.nisn === nisn) || null;

  // Rata-rata nilai rapor semester per tingkat kelas, dihitung dari Nilai_Rapor
  const riwayatNilai = useMemo(() => {
    const baris = DB.rows('Nilai_Rapor').filter((n) => n.nisn === nisn && String(n.periode).startsWith('Rapor Semester'));
    const rata = (tingkat, sem) => {
      const ada = baris.filter((n) => tingkatDariKelas(n.kelas) === tingkat && semesterRapor(n.periode) === sem && n.nilai > 0);
      return ada.length ? Math.round((ada.reduce((t, n) => t + n.nilai, 0) / ada.length) * 10) / 10 : '-';
    };
    return [1, 2, 3, 4, 5, 6].map((t) => ({ kls: `Kelas ${t}`, ganjil: rata(t, 'Semester 1'), genap: rata(t, 'Semester 2') }));
  }, [nisn, DB.rows('Nilai_Rapor')]);

  const keterangan = (r) => (r.genap !== '-' ? 'Naik Kelas' : r.ganjil !== '-' ? 'Sedang Berjalan' : '-');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 no-print">
        <h3 className="font-bold text-gray-700">Leger & Riwayat Akademik Siswa</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="border p-2 rounded text-sm bg-white">
            {rombelList.map((r) => <option key={r.id} value={r.kelas}>{r.kelas}</option>)}
          </select>
          <select value={nisn} onChange={(e) => setNisn(e.target.value)} className="border p-2 rounded text-sm bg-white font-semibold">
            {siswaKelas.map((s) => <option key={s.id} value={s.nisn}>{s.nama}</option>)}
          </select>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-print"></i> Cetak Leger PDF</button>
        </div>
      </div>

      {!siswa ? <KosongInfo teks="Pilih kelas yang sudah memiliki siswa. Atur kelas siswa di menu Data Siswa atau Pengaturan → Rombel." /> : (
        <div id="printable-a4-area" className="p-4 bg-white text-black">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg uppercase underline">Buku Induk Leger Nilai Siswa</h2>
            <p className="text-xs text-gray-600">{sekolah.namaSekolah}</p>
            <p className="text-sm font-semibold mt-1">Nama: {siswa.nama} | NISN: {siswa.nisn}</p>
          </div>
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-2 w-1/4" rowSpan="2">Tingkat Kelas</th>
                <th className="border border-black p-2" colSpan="2">Nilai Rata-rata Rapor Semester</th>
                <th className="border border-black p-2 w-1/4" rowSpan="2">Keterangan</th>
              </tr>
              <tr>
                <th className="border border-black p-2 bg-gray-50">Semester Ganjil</th>
                <th className="border border-black p-2 bg-gray-50">Semester Genap</th>
              </tr>
            </thead>
            <tbody>
              {riwayatNilai.map((item) => (
                <tr key={item.kls}>
                  <td className="border border-black p-2 font-bold">{item.kls}</td>
                  <td className="border border-black p-2">{item.ganjil}</td>
                  <td className="border border-black p-2">{item.genap}</td>
                  <td className="border border-black p-2 italic">{keterangan(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
//  LEGER REKAP LULUSAN — nilai rapor semua mapel, kelas 1–6 (ganjil/genap), rata-rata akumulatif
//  Disimpan di tabel Nilai_Rapor yang sama (lewat aksi saveNilaiRapor). Kelas yang bukan kelas saat ini
//  diberi akhiran " - Kelas N" pada periode agar tidak menimpa nilai kelas lain.
// ---------------------------------------------------------------------------
const SEM_PERIODE = { 'Semester 1': 'Rapor Semester 1 (Triwulan 2)', 'Semester 2': 'Rapor Semester 2 (Triwulan 4)' };
const semesterRapor = (periode) => { const m = /Rapor Semester\s*([12])/.exec(String(periode)); return m ? 'Semester ' + m[1] : ''; };
const tingkatBaris = (n) => { const m = /- Kelas (\d)\s*$/.exec(String(n.periode)); return m ? parseInt(m[1], 10) : tingkatDariKelas(n.kelas); };
const rataAngka = (arr, desimal = 1) => { const a = arr.filter((x) => typeof x === 'number' && !isNaN(x)); const f = Math.pow(10, desimal); return a.length ? Math.round((a.reduce((t, x) => t + x, 0) / a.length) * f) / f : null; };
const TINGKAT = [1, 2, 3, 4, 5, 6];
const SEMESTER = ['Semester 1', 'Semester 2'];

const LegerRekapLulusan = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const lulusanList = useLulusan();
  const semuaNilai = DB.rows('Nilai_Rapor');
  const mapel = useMemo(() => [...DB.rows('Mapel')].sort((a, b) => Number(a.urutan) - Number(b.urutan)), [DB.rows('Mapel')]);
  const [nisn, setNisn] = useState('');
  const [draft, setDraft] = useState({});          // { 't|Semester 1': { namaMapel: '85' } }
  const [proses, jalankan] = useAksi();
  useEffect(() => { if (!lulusanList.some((s) => s.nisn === nisn)) setNisn(lulusanList[0] ? lulusanList[0].nisn : ''); setDraft({}); }, [lulusanList.length]);
  const siswa = lulusanList.find((s) => s.nisn === nisn) || null;
  const dataSiswa = DB.rows('Siswa').find((s) => s.nisn === nisn);
  const tingkatSaatIni = (dataSiswa && tingkatDariKelas(dataSiswa.kelas)) || 6;

  // nilai tersimpan: 't|Semester|mapel' -> angka
  const peta = (ns) => {
    const o = {};
    semuaNilai.filter((n) => n.nisn === ns && semesterRapor(n.periode)).forEach((n) => { const t = tingkatBaris(n); if (t >= 1 && t <= 6 && Number(n.nilai) > 0) o[`${t}|${semesterRapor(n.periode)}|${n.mapel}`] = Number(n.nilai); });
    return o;
  };
  const tersimpan = useMemo(() => peta(nisn), [nisn, semuaNilai]);
  const nilaiSel = (t, sem, m) => {
    const d = draft[`${t}|${sem}`];
    if (d && d[m] !== undefined) { const v = parseFloat(String(d[m]).replace(',', '.')); return isNaN(v) ? null : v; }
    const s = tersimpan[`${t}|${sem}|${m}`]; return s === undefined ? null : s;
  };
  const tampil = (t, sem, m) => { const d = draft[`${t}|${sem}`]; if (d && d[m] !== undefined) return d[m]; const s = tersimpan[`${t}|${sem}|${m}`]; return s === undefined ? '' : String(s); };
  const ubah = (t, sem, m, v) => setDraft((x) => ({ ...x, [`${t}|${sem}`]: { ...(x[`${t}|${sem}`] || {}), [m]: v } }));

  const rataMapel = (m) => rataAngka(TINGKAT.flatMap((t) => SEMESTER.map((s) => nilaiSel(t, s, m))), 2);
  const rataKolom = (t, s) => rataAngka(mapel.map((m) => nilaiSel(t, s, m.nama)), 2);
  const akumulatif = rataAngka(mapel.flatMap((m) => TINGKAT.flatMap((t) => SEMESTER.map((s) => nilaiSel(t, s, m.nama)))), 2);
  const fmt = (x) => (x === null ? '-' : String(x).replace('.', ','));
  const jumlahDraft = Object.keys(draft).reduce((n, k) => n + Object.keys(draft[k]).length, 0);

  const simpan = () => jalankan(async () => {
    const kunci = Object.keys(draft).filter((k) => Object.keys(draft[k]).some((m) => String(draft[k][m]).trim() !== ''));
    if (!kunci.length) { showAlert('Tidak ada perubahan untuk disimpan.', 'info'); return; }
    for (const k of kunci) {                         // validasi semua dulu sebelum mengirim
      Object.keys(draft[k]).forEach((m) => { const s = String(draft[k][m]).trim(); if (s === '') return; const v = parseFloat(s.replace(',', '.')); if (isNaN(v) || v < 0 || v > 100) throw new Error(`Nilai "${m}" (${k.replace('|', ' ')}) harus 0–100.`); });
    }
    let n = 0;
    for (const k of kunci) {
      const [t, sem] = k.split('|'); const tingkat = parseInt(t, 10);
      const items = Object.keys(draft[k]).filter((m) => String(draft[k][m]).trim() !== '').map((m) => {
        const lama = semuaNilai.find((x) => x.nisn === nisn && x.mapel === m && semesterRapor(x.periode) === sem && tingkatBaris(x) === tingkat);
        return { mapel: m, nilai: parseFloat(String(draft[k][m]).replace(',', '.')), capaian: lama ? lama.capaian : (tingkat === tingkatSaatIni ? CAPAIAN_DEFAULT : '') };
      });
      const periode = SEM_PERIODE[sem] + (tingkat === tingkatSaatIni ? '' : ` - Kelas ${tingkat}`);
      await DB.simpanNilaiRapor({ nisn, nama: siswa.nama, kelas: tingkat === tingkatSaatIni ? (dataSiswa ? dataSiswa.kelas : String(tingkat)) : String(tingkat), periode, items });
      n += items.length;
    }
    setDraft({});
    showAlert(`${n} nilai berhasil disimpan.`);
  });

  // ringkasan semua lulusan
  const ringkasan = useMemo(() => lulusanList.map((s) => {
    const p = peta(s.nisn); const semua = Object.keys(p);
    const perTingkat = TINGKAT.map((t) => rataAngka(semua.filter((k) => k.startsWith(t + '|')).map((k) => p[k]), 1));
    return { nisn: s.nisn, nama: s.nama, perTingkat, akumulatif: rataAngka(semua.map((k) => p[k]), 2), jumlah: semua.length };
  }), [lulusanList, semuaNilai]);

  const sel = 'border border-black p-1';
  return (
    <div className="space-y-4">
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 no-print">
          <div>
            <h3 className="font-bold text-gray-700">Rekap Nilai Rapor Lulusan (Kelas 1–6, Ganjil/Genap)</h3>
            <p className="text-xs text-gray-500">Siswa kelas 6 / berstatus Lulus. Isi nilai tiap mata pelajaran per semester; rata-rata akumulatif dihitung otomatis.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={nisn} onChange={(e) => { if (jumlahDraft && !confirm('Perubahan yang belum disimpan akan hilang. Lanjutkan?')) return; setNisn(e.target.value); setDraft({}); }} className="border p-2 rounded text-sm bg-white font-semibold">
              {lulusanList.map((s) => <option key={s.nisn} value={s.nisn}>{s.nama}</option>)}
            </select>
            <button onClick={simpan} disabled={proses || !jumlahDraft} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-save"></i> Simpan{jumlahDraft ? ` (${jumlahDraft})` : ''}</button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-print"></i> Cetak PDF</button>
          </div>
        </div>

        {!siswa ? <KosongInfo teks="Belum ada lulusan. Siswa kelas 6 atau berstatus Lulus otomatis muncul di sini." /> : mapel.length === 0 ? <KosongInfo teks="Belum ada mata pelajaran. Tambahkan di Pengaturan." /> : (
          <div id="printable-a4-area" className="p-2 bg-white text-black overflow-x-auto">
            <div className="text-center mb-3">
              <h2 className="font-bold text-base uppercase underline">Rekap Nilai Rapor Siswa Lulusan</h2>
              <p className="text-xs">{sekolah.namaSekolah}</p>
              <p className="text-sm font-semibold mt-1">Nama: {siswa.nama} | NISN: {siswa.nisn}</p>
            </div>
            <table className="w-full border-collapse border border-black text-[11px] text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className={sel} rowSpan="2">No</th>
                  <th className={`${sel} text-left`} rowSpan="2">Mata Pelajaran</th>
                  {TINGKAT.map((t) => <th key={t} className={sel} colSpan="2">Kelas {t}</th>)}
                  <th className={sel} rowSpan="2">Rata-rata</th>
                </tr>
                <tr>{TINGKAT.flatMap((t) => SEMESTER.map((s) => <th key={t + s} className={`${sel} bg-gray-50 font-normal`}>{s === 'Semester 1' ? 'Ganjil' : 'Genap'}</th>))}</tr>
              </thead>
              <tbody>
                {mapel.map((m, i) => (
                  <tr key={m.id}>
                    <td className={sel}>{i + 1}</td>
                    <td className={`${sel} text-left`}>{m.nama}</td>
                    {TINGKAT.flatMap((t) => SEMESTER.map((s) => (
                      <td key={t + s} className={sel}>
                        <input value={tampil(t, s, m.nama)} onChange={(e) => ubah(t, s, m.nama, e.target.value)} inputMode="decimal" maxLength={6}
                          className={`w-11 text-center bg-transparent outline-none focus:bg-yellow-100 ${draft[`${t}|${s}`] && draft[`${t}|${s}`][m.nama] !== undefined ? 'bg-yellow-50 font-bold' : ''}`} />
                      </td>
                    )))}
                    <td className={`${sel} font-bold bg-gray-50`}>{fmt(rataMapel(m.nama))}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className={sel} colSpan="2">Rata-rata</td>
                  {TINGKAT.flatMap((t) => SEMESTER.map((s) => <td key={t + s} className={sel}>{fmt(rataKolom(t, s))}</td>))}
                  <td className={sel}>{fmt(akumulatif)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 inline-block border-2 border-black px-4 py-2 font-bold text-sm">Rata-rata akumulatif kelas 1–6: {fmt(akumulatif)}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto no-print">
        <div className="p-4 border-b font-bold text-gray-700 text-sm">Ringkasan Seluruh Lulusan <span className="font-normal text-gray-500 text-xs">(rata-rata per kelas dan akumulatif; klik nama untuk membuka)</span></div>
        <table className="w-full text-xs text-center">
          <thead className="bg-gray-100"><tr><th className="p-2 text-left">Nama</th>{TINGKAT.map((t) => <th key={t} className="p-2">Kls {t}</th>)}<th className="p-2">Akumulatif</th></tr></thead>
          <tbody>
            {ringkasan.length === 0 && <tr><td colSpan="8"><KosongInfo teks="Belum ada lulusan." /></td></tr>}
            {ringkasan.map((r) => (
              <tr key={r.nisn} className="border-t hover:bg-gray-50">
                <td className="p-2 text-left"><button className="text-green-700 hover:underline font-semibold" onClick={() => { if (jumlahDraft && !confirm('Perubahan yang belum disimpan akan hilang. Lanjutkan?')) return; setNisn(r.nisn); setDraft({}); }}>{r.nama}</button></td>
                {r.perTingkat.map((x, i) => <td key={i} className="p-2">{fmt(x)}</td>)}
                <td className="p-2 font-bold">{r.jumlah ? fmt(r.akumulatif) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Leger: dua tampilan (riwayat per kelas yang sudah ada + rekap lulusan baru)
const Leger = () => {
  const [mode, setMode] = useState('kelas');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 no-print border-b border-gray-300">
        {[['kelas', 'Riwayat per Kelas', 'fa-clipboard-list'], ['lulusan', 'Rekap Nilai Lulusan (Kelas 1–6)', 'fa-graduation-cap']].map(([k, label, ikon]) => (
          <button key={k} onClick={() => setMode(k)} className={`px-4 py-2 text-sm font-bold rounded-t-lg border border-b-0 ${mode === k ? 'bg-white text-green-700 border-gray-300' : 'bg-gray-200 text-gray-500 hover:bg-gray-100'}`}><i className={`fas ${ikon} mr-2`}></i>{label}</button>
        ))}
      </div>
      {mode === 'kelas' ? <LegerPerKelas /> : <LegerRekapLulusan />}
    </div>
  );
};


// Lembar rapor A4 (Semester 1 / Semester 2). Dipakai oleh Cetak Rapor dan pratinjau langsung di Input Nilai.
const LembarRapor = ({ sekolah, siswa, kelas, semester, daftarMapel, pendukung, wali, waliGuru }) => {
  const kelasRapor = kelas;
  const semesterRapor = semester;
  const namaSiswaRapor = siswa ? siswa.nama : '-';
  const daftarRaporMapel = daftarMapel;
  const tingkat = tingkatDariKelas(kelasRapor);
  const keteranganKenaikan = tingkat >= 6 ? 'Lulus' : `Naik ke kelas ${tingkat + 1}`;
  return (
    <>
      {/* PRATINJAU RAPOR A4 */}
      <div className="bg-gray-200 p-6 rounded-lg flex flex-col items-center">
        <h4 className="font-bold text-gray-700 mb-3 self-start no-print"><i className="fas fa-file-alt text-green-600"></i> Pratinjau Lembar Rapor Resmi A4</h4>
        
        <div id="printable-a4-area" className="bg-white w-full max-w-[750px] p-10 shadow-xl font-serif text-[11px] leading-relaxed relative border text-black space-y-4">
          
          <div className="grid grid-cols-2 gap-4 border-b border-black pb-3 text-xs">
            <div className="space-y-1">
              <div><span className="font-semibold">Nama</span> : {namaSiswaRapor}</div>
              <div><span className="font-semibold">NIS/NISN</span> : {siswa ? ((siswa.nis ? siswa.nis + ' / ' : '') + siswa.nisn) : '-'}</div>
              <div><span className="font-semibold">Nama Sekolah</span> : SDIT ANNIHAYAH</div>
              <div><span className="font-semibold">Alamat</span> : {sekolah.alamat}</div>
            </div>
            <div className="space-y-1 text-left-6">
              <div><span className="font-semibold">Kelas</span> : {kelasRapor}</div>
              <div><span className="font-semibold">Fase</span> : C</div>
              <div><span className="font-semibold">Semester</span> : {semesterRapor.includes('1') ? '1' : '2'}</div>
              <div><span className="font-semibold">Tahun Pelajaran</span> : {sekolah.tahunAjaran}</div>
            </div>
          </div>

          <div className="text-center my-2">
            <h2 className="font-extrabold text-sm uppercase tracking-wide">LAPORAN HASIL BELAJAR</h2>
          </div>

          <table className="w-full text-[10px] border border-black">
            <thead>
              <tr className="bg-gray-100 text-center font-bold">
                <th className="border border-black p-1.5 w-8">No</th>
                <th className="border border-black p-1.5 w-36 text-left">Mata Pelajaran</th>
                <th className="border border-black p-1.5 w-12">Nilai Akhir</th>
                <th className="border border-black p-1.5 text-left">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {daftarRaporMapel.map((item) => (
                <tr key={item.no}>
                  <td className="border border-black p-1.5 text-center align-top">{item.no}</td>
                  <td className="border border-black p-1.5 font-medium align-top">{item.mapel}</td>
                  <td className="border border-black p-1.5 text-center font-bold align-top">{item.nilai}</td>
                  <td className="border border-black p-1.5 whitespace-pre-line align-top">{item.capai}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-3 pt-4">
            <div>
              <table className="w-full text-[10px] border border-black">
                <thead>
                  <tr className="bg-gray-100 text-center font-bold">
                    <th className="border border-black p-1 w-10">No</th>
                    <th className="border border-black p-1 text-left w-40">Kegiatan Ekstrakurikuler</th>
                    <th className="border border-black p-1 w-20">Predikat</th>
                    <th className="border border-black p-1 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center">1</td>
                    <td className="border border-black p-1 font-medium">{pendukung && pendukung.ekskul ? pendukung.ekskul : '-'}</td>
                    <td className="border border-black p-1 text-center font-bold">{pendukung && pendukung.predikat ? pendukung.predikat : '-'}</td>
                    <td className="border border-black p-1">{pendukung ? pendukung.ketEkskul : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-1/3 border border-black p-2 text-[10px]">
              <div className="flex justify-between py-0.5 border-b"><span>Sakit</span><span>: {pendukung ? pendukung.sakit : 0} hari</span></div>
              <div className="flex justify-between py-0.5 border-b"><span>Izin</span><span>: {pendukung ? pendukung.izin : 0} hari</span></div>
              <div className="flex justify-between py-0.5"><span>Tanpa Keterangan</span><span>: {pendukung ? pendukung.alpha : 0} hari</span></div>
            </div>

            <div className="border border-black p-2 text-[10px] space-y-1">
              <p className="font-bold uppercase">Catatan Wali Kelas :</p>
              <p className="italic">{pendukung && pendukung.catatan ? `"${pendukung.catatan}"` : '—'}</p>
            </div>

            {semesterRapor.includes('Semester 2') && (
              <div className="font-bold text-center border border-black p-1.5 bg-gray-50">
                Keterangan Kenaikan Kelas : {keteranganKenaikan}
              </div>
            )}

            {/* TANDA TANGAN: KEPALA SEKOLAH POSISINYA LEBIH KE BAWAH */}
            <div className="grid grid-cols-3 pt-4 text-[10px] items-start text-center">
              <div className="space-y-12">
                <p>Mengetahui,<br/>Orang Tua/Wali,</p>
                <p className="font-bold underline">( ................................... )</p>
              </div>
              
              {/* Kolom Kepala Sekolah Diberi Jarak Atas (mt-6) agar lebih ke bawah dibanding Wali Kelas & Orang Tua */}
              <div className="space-y-3 flex flex-col items-center mt-6">
                <p>Mengetahui,<br/>Kepala Sekolah,</p>
                <div className="w-14 h-14 border rounded-full flex items-center justify-center text-[7px] text-white-400 border-white-600">
                  
                </div>
                <p className="font-bold underline"><NamaTtd nama={sekolah.kepsek} maks="56mm" /><br/>NIP. {sekolah.nipKepsek || '-'}</p>
              </div>

              <div className="space-y-12">
                <p>{sekolah.kota}, {tanggalHariIni()}<br/>Wali Kelas,</p>
                <p className="font-bold underline"><NamaTtd nama={wali} maks="56mm" /><br/>NIP. {waliGuru && waliGuru.nip ? waliGuru.nip : '-'}</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </>
  );
};

const CetakRapor = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const rombelList = DB.rows('Rombel');
  const [kelasRapor, setKelasRapor] = useState(rombelList[0] ? rombelList[0].kelas : '');
  const [semesterRapor, setSemesterRapor] = useState('Semester 1 (Triwulan 2)');
  const [nisnRapor, setNisnRapor] = useState('');

  const siswaKelas = DB.rows('Siswa').filter((s) => s.kelas === kelasRapor);
  useEffect(() => {
    if (!siswaKelas.some((s) => s.nisn === nisnRapor)) setNisnRapor(siswaKelas[0] ? siswaKelas[0].nisn : '');
  }, [kelasRapor, DB.rows('Siswa')]);

  const siswa = siswaKelas.find((s) => s.nisn === nisnRapor) || null;
  const namaSiswaRapor = siswa ? siswa.nama : '-';
  const adaSemester2 = semesterRapor.includes('Semester 2');
  const periodeRapor = adaSemester2 ? 'Rapor Semester 2 (Triwulan 4)' : 'Rapor Semester 1 (Triwulan 2)';
  const mapelList = [...DB.rows('Mapel')].sort((a, b) => a.urutan - b.urutan);
  const nilaiRows = DB.rows('Nilai_Rapor').filter((n) => n.nisn === nisnRapor && n.periode === periodeRapor);
  const daftarRaporMapel = mapelList.map((m, i) => {
    const n = nilaiRows.find((x) => x.mapel === m.nama);
    return { no: i + 1, mapel: m.nama, nilai: n ? n.nilai : '-', capai: n ? n.capaian : '' };
  });
  const pendukung = DB.rows('Catatan_Rapor').find((c) => c.nisn === nisnRapor && c.semester === (adaSemester2 ? 'Semester 2' : 'Semester 1')) || null;
  const rombel = rombelList.find((r) => r.kelas === kelasRapor);
  const wali = rombel ? rombel.wali : '...................';
  const waliGuru = DB.rows('Guru').find((g) => rombel && g.nama === rombel.wali);
  const tingkat = tingkatDariKelas(kelasRapor);
  const keteranganKenaikan = tingkat >= 6 ? 'Lulus' : `Naik ke kelas ${tingkat + 1}`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border no-print">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-bold text-gray-700">Pusat Cetak Rapor Semester</h3>
          <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 shadow-sm">
            <i className="fas fa-print"></i> Cetak Rapor Resmi A4 (PDF)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Pilih Kelas</label>
            <select value={kelasRapor} onChange={(e) => setKelasRapor(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white">
              {rombelList.map((r) => <option key={r.id} value={r.kelas}>{r.kelas}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Nama Peserta Didik</label>
            <select value={nisnRapor} onChange={(e) => setNisnRapor(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white font-semibold">
              {siswaKelas.map((s) => <option key={s.id} value={s.nisn}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Periode Rapor</label>
            <select value={semesterRapor} onChange={(e) => setSemesterRapor(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white font-bold text-green-700">
              <option value="Semester 1 (Triwulan 2)">Semester 1 (Triwulan 2) [Ganjil]</option>
              <option value="Semester 2 (Triwulan 4)">Semester 2 (Triwulan 4) [Genap]</option>
            </select>
          </div>
        </div>
      </div>

      <LembarRapor sekolah={sekolah} siswa={siswa} kelas={kelasRapor} semester={semesterRapor} daftarMapel={daftarRaporMapel} pendukung={pendukung} wali={wali} waliGuru={waliGuru} />

    </div>
  );
};

const RekapLulusan = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <table className="w-full text-sm text-center border">
      <thead className="bg-gray-50"><tr><th className="p-3 border">Nama</th><th className="p-3 border">Data Rapor Sem 1-12</th></tr></thead>
      <tbody><tr><td className="p-3 border">Fatimah</td><td className="p-3 border flex justify-center gap-2"><button onClick={() => showAlert("Menampilkan Rekap Nilai Semester 1 s/d 12")} className="bg-blue-50 border px-3 py-1 rounded text-blue-700"><i className="fas fa-eye"></i> Lihat Lengkap</button></td></tr></tbody>
    </table>
  </div>
);


const ArsipLulusan = () => {
  const sekolah = useSekolah();
  const lulusanList = useLulusan();
  const [selectedArsip, setSelectedArsip] = useState(null);
  const [modalType, setModalType] = useState(null);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border no-print">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-bold text-gray-700">Arsip Lulusan & Pusat Cetak Dokumen Kelulusan A4</h3>
          <select className="border p-2 rounded text-sm"><option>Angkatan 2025/2026</option></select>
        </div>

        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 border">NISN</th>
              <th className="p-3 border">Nama Siswa</th>
              <th className="p-3 border text-center">Aksi Dokumen Kelulusan (A4 PDF)</th>
            </tr>
          </thead>
          <tbody>
            {lulusanList.map((item) => (
              <tr key={item.nisn} className="hover:bg-gray-50">
                <td className="p-3 border">{item.nisn}</td>
                <td className="p-3 border font-medium">{item.nama}</td>
                <td className="p-3 border text-center flex justify-center gap-2">
                  <button onClick={() => { setSelectedArsip(item); setModalType('ijazah'); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <i className="fas fa-print"></i> Cetak Ijazah
                  </button>
                  <button onClick={() => { setSelectedArsip(item); setModalType('transkrip'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <i className="fas fa-print"></i> Cetak Transkrip Nilai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PRATINJAU CETAK IJAZAH A4 --- */}
      {modalType === 'ijazah' && selectedArsip && (
        <div className="bg-gray-200 p-6 rounded-lg flex flex-col items-center">
          <div className="w-full max-w-[750px] flex justify-between items-center mb-2 no-print">
            <h4 className="font-bold text-gray-700"><i className="fas fa-certificate text-green-600"></i> Pratinjau Lembar Ijazah A4</h4>
            <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-red-500 font-bold">Tutup Pratinjau</button>
          </div>
          
          <div id="printable-a4-area" className="bg-white w-full max-w-[750px] p-12 shadow-xl font-serif text-xs leading-relaxed relative border-4 border-green-800 text-black space-y-6">
            
            <div className="text-center border-b-2 border-black pb-4">
              <h2 className="font-bold text-sm tracking-widest text-green-900">REPUBLIK INDONESIA</h2>
              <h1 className="font-extrabold text-lg text-black mt-1">IJAZAH SEKOLAH DASAR (SD)</h1>
              <p className="text-[10px] text-gray-700">YAYASAN ANNIHAYAH - SDIT ANNIHAYAH KABUPATEN KARAWANG</p>
              <p className="text-[10px] font-bold mt-1">Nomor Seri Ijazah : {selectedArsip.noIjazah}</p>
            </div>

            <div className="space-y-3">
              <p className="text-center italic text-gray-600">Yang bertanda tangan di bawah ini, Kepala Sekolah Dasar Islam Terpadu Annihayah menerangkan bahwa:</p>
              
              <div className="grid grid-cols-4 gap-4 items-center bg-gray-50 p-4 border rounded">
                <div className="col-span-3 space-y-2">
                  <div className="grid grid-cols-3"><span className="font-semibold">Nama Lengkap</span><span className="col-span-2 font-bold">: {selectedArsip.nama}</span></div>
                  <div className="grid grid-cols-3"><span className="font-semibold">NIS / NISN</span><span className="col-span-2">: {selectedArsip.nis ? selectedArsip.nis + ' / ' : ''}{selectedArsip.nisn}</span></div>
                  <div className="grid grid-cols-3"><span className="font-semibold">Tempat, Tgl Lahir</span><span className="col-span-2">: {selectedArsip.ttl}</span></div>
                  <div className="grid grid-cols-3"><span className="font-semibold">Nama Orang Tua</span><span className="col-span-2">: Bapak & Ibu Wali Siswa</span></div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <div className="w-24 h-32 border-2 border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 bg-white">
                    FOTO 3x4
                  </div>
                </div>
              </div>

              <p className="text-justify leading-relaxed">
                Lulus dari satuan pendidikan setelah menyelesaikan seluruh program pembelajaran dan dinyatakan lulus berdasarkan standar nasional pendidikan.
              </p>
            </div>

            {/* TANDA TANGAN KEPALA SEKOLAH DENGAN TANGGAL TERBIT DI ATASNYA */}
            <div className="mt-16 flex justify-end pt-4 text-xs">
              <div className="text-center">
                <p>{sekolah.kota}, {tanggalPanjang(selectedArsip.tglIjazah) || tanggalHariIni()}</p>
                <p>Kepala SDIT Annihayah,</p>
                <br/><br/><br/>
                <p className="font-bold underline"><NamaTtd nama={sekolah.kepsek} maks="100mm" /></p>
                <p>NIP. {sekolah.nipKepsek || '-'}</p>
              </div>
            </div>

          </div>

          <div className="mt-4 no-print flex gap-3">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold shadow-sm">
              <i className="fas fa-print mr-1"></i> Cetak Ijazah (PDF A4)
            </button>
            <button onClick={() => setModalType(null)} className="bg-gray-500 text-white px-4 py-2 rounded text-sm">Tutup</button>
          </div>
        </div>
      )}

      {/* --- PRATINJAU CETAK TRANSKRIP NILAI A4 --- */}
      {modalType === 'transkrip' && selectedArsip && (
        <div className="bg-gray-200 p-6 rounded-lg flex flex-col items-center">
          <div className="w-full max-w-[750px] flex justify-between items-center mb-2 no-print">
            <h4 className="font-bold text-gray-700"><i className="fas fa-file-alt text-blue-600"></i> Pratinjau Transkrip Nilai A4</h4>
            <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-red-500 font-bold">Tutup Pratinjau</button>
          </div>
          
          <div id="printable-a4-area" className="bg-white w-full max-w-[750px] p-12 shadow-xl font-serif text-xs leading-relaxed relative border text-black space-y-6">
            
            <div className="text-center border-b-2 border-black pb-3">
              <h2 className="font-bold text-sm tracking-wide text-green-800">YAYASAN ANNIHAYAH</h2>
              <h1 className="font-extrabold text-lg text-green-900">SDIT ANNIHAYAH</h1>
              <p className="text-[10px] text-gray-600 font-semibold mt-1">TRANSKRIP NILAI UJIAN KELULUSAN SEKOLAH DASAR</p>
              <p className="text-[10px]">Nomor Seri Ijazah : {selectedArsip.noIjazah}</p>
            </div>

            <div className="space-y-1 text-xs bg-gray-50 p-3 border rounded">
              <div><span className="font-semibold">Nama Peserta Didik</span> : {selectedArsip.nama}</div>
              <div><span className="font-semibold">NISN / NIS</span> : {selectedArsip.nisn} / {selectedArsip.nis || '-'}</div>
              <div><span className="font-semibold">Tempat, Tanggal Lahir</span> : {selectedArsip.ttl}</div>
            </div>

            <div>
              <h4 className="font-bold text-xs mb-1 uppercase bg-gray-100 p-1.5 border border-black">Daftar Nilai Ujian Akhir Sekolah</h4>
              <table className="w-full text-xs border border-black">
                <thead>
                  <tr className="bg-gray-50 text-center font-bold">
                    <th className="border border-black p-2 w-10">No</th>
                    <th className="border border-black p-2 text-left">Komponen Ujian Kelulusan</th>
                    <th className="border border-black p-2 w-32">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center">1</td>
                    <td className="border border-black p-2 font-medium">Nilai Ujian Tulis Sekolah</td>
                    <td className="border border-black p-2 text-center font-bold text-sm">{selectedArsip.tulis}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 text-center">2</td>
                    <td className="border border-black p-2 font-medium">Nilai Ujian Praktek</td>
                    <td className="border border-black p-2 text-center font-bold text-sm">{selectedArsip.praktek}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 text-center">3</td>
                    <td className="border border-black p-2 font-medium">Nilai TKA (Tes Kemampuan Akademik)</td>
                    <td className="border border-black p-2 text-center font-bold text-sm">{selectedArsip.tka}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TANDA TANGAN KEPALA SEKOLAH DENGAN TANGGAL TERBIT DI ATASNYA */}
            <div className="mt-16 flex justify-end pt-4 text-xs">
              <div className="text-center">
                <p>{sekolah.kota}, {tanggalPanjang(selectedArsip.tglIjazah) || tanggalHariIni()}</p>
                <p>Kepala SDIT Annihayah,</p>
                <br/><br/><br/>
                <p className="font-bold underline"><NamaTtd nama={sekolah.kepsek} maks="100mm" /></p>
                <p>NIP. {sekolah.nipKepsek || '-'}</p>
              </div>
            </div>

          </div>

          <div className="mt-4 no-print flex gap-3">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold shadow-sm">
              <i className="fas fa-print mr-1"></i> Cetak Transkrip Nilai (PDF A4)
            </button>
            <button onClick={() => setModalType(null)} className="bg-gray-500 text-white px-4 py-2 rounded text-sm">Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
};

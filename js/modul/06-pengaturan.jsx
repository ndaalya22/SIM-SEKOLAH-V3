const Pengaturan = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const [proses, jalankan] = useAksi();
  const [activeTab, setActiveTab] = useState('profil');
  const tabs = [
    { id: 'profil', label: 'Profil Sekolah & Kop' },
    { id: 'rombel', label: 'Kelola Rombel & Walikelas' },
    { id: 'mapel', label: 'Kelola Mata Pelajaran' },
    { id: 'cptp', label: 'Kelola CP / TP' }
  ];
  const guruList = DB.rows('Guru');
  const rombelList = DB.rows('Rombel');
  const siswaList = DB.rows('Siswa');
  const mapelList = [...DB.rows('Mapel')].sort((a, b) => a.urutan - b.urutan);
  const cptpList = DB.rows('CP_TP');
  const inp = 'w-full border p-2 rounded mt-1 text-sm';

  // ---------------- PROFIL ----------------
  const [profil, setProfil] = useState({ namaSekolah: '', namaYayasan: '', npsn: '', alamat: '', kota: '', kepsek: '', nipKepsek: '', tahunAjaran: '', ...sekolah });
  const ubahProfil = (k) => (e) => setProfil({ ...profil, [k]: e.target.value });
  const simpanProfil = () => jalankan(async () => {
    const { logoUrl, ...tanpaLogo } = profil;
    const bersih = {}; Object.keys(tanpaLogo).forEach((k) => { if (['namaSekolah', 'namaYayasan', 'npsn', 'alamat', 'kota', 'kepsek', 'nipKepsek', 'tahunAjaran'].includes(k)) bersih[k] = tanpaLogo[k]; });
    await DB.simpanPengaturan(bersih);
    showAlert('Profil sekolah berhasil disimpan.');
  });
  const unggahLogo = (e) => {
    const file = e.target.files[0]; if (!file) return;
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'logo');
      await DB.simpanPengaturan({ logoUrl: hasil.url });
      showAlert('Logo sekolah berhasil diunggah dan dipasang.');
    });
  };

  // ---------------- MUSIK LATAR ----------------
  const unggahMusik = (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return showAlert('Ukuran audio maksimal 6 MB.', 'error');
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'musik');
      await DB.simpanPengaturan({ musikFileId: hasil.id, musikJudul: file.name.replace(/\.[^.]+$/, ''), musikMime: hasil.mime || file.type });
      window.dispatchEvent(new Event('sim-musik-berubah'));
      showAlert('Musik latar berhasil dipasang.');
    });
  };
  const hapusMusik = () => {
    if (confirm('Hapus musik latar?')) jalankan(async () => {
      await apiPanggil('hapusMusik');
      await DB.simpanPengaturan({});
      window.dispatchEvent(new Event('sim-musik-berubah'));
      showAlert('Musik latar dihapus.');
    });
  };

  // ---------------- ROMBEL ----------------
  const [modalRombel, setModalRombel] = useState(false);
  const [formRombel, setFormRombel] = useState({ id: '', kelas: '', wali: '' });
  const jumlahSiswaKelas = (kelas) => siswaList.filter((s) => s.kelas === kelas).length;
  const simpanRombel = (e) => {
    e.preventDefault();
    if (!formRombel.wali) return showAlert('Silakan pilih wali kelas terlebih dahulu.', 'error');
    jalankan(async () => {
      await DB.simpan('Rombel', formRombel);
      showAlert(formRombel.id ? 'Rombel berhasil diperbarui.' : 'Rombel baru berhasil ditambahkan.');
      setModalRombel(false);
    });
  };
  const hapusRombel = (r) => {
    if (jumlahSiswaKelas(r.kelas) > 0) return showAlert(`Rombel ${r.kelas} masih memiliki siswa. Pindahkan siswanya dulu.`, 'error');
    if (confirm(`Hapus rombel ${r.kelas}?`)) jalankan(async () => { await DB.hapus('Rombel', r.id); showAlert('Rombel dihapus.'); });
  };

  // Siswa per rombel (mengubah kolom "kelas" pada data siswa)
  const [rombelSiswaId, setRombelSiswaId] = useState(null);
  const [siswaTambah, setSiswaTambah] = useState('');
  const rombelAktif = rombelList.find((r) => r.id === rombelSiswaId) || null;
  const anggota = rombelAktif ? siswaList.filter((s) => s.kelas === rombelAktif.kelas) : [];
  const calon = siswaList.filter((s) => !rombelAktif || s.kelas !== rombelAktif.kelas);
  const pindahSiswa = (siswa, kelasBaru) => jalankan(async () => { await DB.simpan('Siswa', { ...siswa, kelas: kelasBaru }); });
  const tambahKeKelas = (e) => {
    e.preventDefault();
    const s = siswaList.find((x) => x.nisn === siswaTambah);
    if (!s) return;
    jalankan(async () => { await DB.simpan('Siswa', { ...s, kelas: rombelAktif.kelas }); setSiswaTambah(''); showAlert(`${s.nama} dimasukkan ke ${rombelAktif.kelas}.`); });
  };

  // ---------------- MAPEL ----------------
  const [modalMapel, setModalMapel] = useState(false);
  const [formMapel, setFormMapel] = useState({ id: '', nama: '', kelompok: 'Muatan Nasional', urutan: 0 });
  const simpanMapel = (e) => {
    e.preventDefault();
    const urutan = formMapel.id ? formMapel.urutan : (mapelList.reduce((m, x) => Math.max(m, x.urutan), 0) + 1);
    jalankan(async () => { await DB.simpan('Mapel', { ...formMapel, urutan }); showAlert('Mata pelajaran disimpan.'); setModalMapel(false); });
  };
  const hapusMapel = (m) => {
    if (confirm(`Hapus mapel "${m.nama}"? Nilai yang sudah diinput tidak ikut terhapus tetapi tidak tampil lagi di rapor.`))
      jalankan(async () => { await DB.hapus('Mapel', m.id); showAlert('Mapel dihapus.'); });
  };

  // ---------------- CP/TP ----------------
  const [modalCptp, setModalCptp] = useState(false);
  const [formCptp, setFormCptp] = useState({ id: '', kelas: '', mapel: '', kode: '', deskripsi: '' });
  const simpanCptp = (e) => {
    e.preventDefault();
    jalankan(async () => { await DB.simpan('CP_TP', formCptp); showAlert('CP/TP disimpan.'); setModalCptp(false); });
  };
  const hapusCptp = (c) => { if (confirm(`Hapus ${c.kode}?`)) jalankan(async () => { await DB.hapus('CP_TP', c.id); showAlert('CP/TP dihapus.'); }); };

  const tombolTambah = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5';
  const tombolUbah = 'text-yellow-600 border border-yellow-200 px-2.5 py-1 rounded text-xs hover:bg-yellow-50';
  const tombolHapus = 'text-red-600 border border-red-200 px-2.5 py-1 rounded text-xs hover:bg-red-50';

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/4 bg-white rounded-lg shadow-sm border overflow-hidden h-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left p-3 text-sm font-medium border-b last:border-b-0 ${activeTab === tab.id ? 'bg-green-50 text-green-700 border-l-4 border-l-green-600' : 'text-gray-600 hover:bg-gray-50'}`}>{tab.label}</button>
        ))}
      </div>

      <div className="w-full md:w-3/4 bg-white p-6 rounded-lg border shadow-sm min-h-[400px]">
        {activeTab === 'profil' && (
          <div>
            <h3 className="font-bold border-b pb-2 mb-4 text-gray-700">Profil Sekolah & Pengaturan Kop Surat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-600">Nama Sekolah</label><input value={profil.namaSekolah} onChange={ubahProfil('namaSekolah')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">Nama Yayasan</label><input value={profil.namaYayasan} onChange={ubahProfil('namaYayasan')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">Kepala Sekolah</label><input value={profil.kepsek} onChange={ubahProfil('kepsek')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">NIP Kepala Sekolah</label><input value={profil.nipKepsek} onChange={ubahProfil('nipKepsek')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">NPSN</label><input value={profil.npsn} onChange={ubahProfil('npsn')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">Tahun Ajaran Aktif</label><input value={profil.tahunAjaran} onChange={ubahProfil('tahunAjaran')} placeholder="2026/2027" className={inp} /></div>
              <div className="md:col-span-2"><label className="text-sm text-gray-600">Alamat (untuk Kop)</label><input value={profil.alamat} onChange={ubahProfil('alamat')} className={inp} /></div>
              <div><label className="text-sm text-gray-600">Kota (untuk tanda tangan)</label><input value={profil.kota} onChange={ubahProfil('kota')} className={inp} /></div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Unggah Logo Sekolah (Kop Surat)</label>
                <input type="file" accept="image/*" onChange={unggahLogo} className="w-full border p-2 rounded mt-1 text-sm bg-gray-50" />
                {sekolah.logoUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={sekolah.logoUrl} alt="Logo" className="w-12 h-12 object-contain border rounded p-1" />
                    <span className="text-xs text-green-600 font-semibold">Logo aktif terpasang pada sistem.</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 border-t pt-4">
                <label className="text-sm text-gray-600 font-semibold"><i className="fas fa-music text-green-600 mr-1"></i> Musik Latar (diputar setelah login, pengunjung dapat mematikannya)</label>
                <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav" onChange={unggahMusik} className="w-full border p-2 rounded mt-1 text-sm bg-gray-50" />
                <p className="text-[11px] text-gray-500 mt-1">Format MP3/M4A/OGG/WAV, maksimal 6 MB. Gunakan musik milik sendiri atau bebas royalti (mis. YouTube Audio Library yang boleh diunduh).</p>
                {sekolah.musikFileId ? (
                  <div className="mt-2 flex items-center gap-3 bg-green-50 border border-green-200 rounded p-2">
                    <i className="fas fa-compact-disc text-green-600"></i><span className="text-sm font-semibold flex-1 truncate">{sekolah.musikJudul || 'Musik latar'}</span>
                    <button onClick={hapusMusik} disabled={proses} className="text-red-600 border border-red-200 px-2.5 py-1 rounded text-xs hover:bg-red-50"><i className="fas fa-trash"></i> Hapus</button>
                  </div>
                ) : <p className="text-xs text-gray-400 mt-2">Belum ada musik latar.</p>}
              </div>
            </div>
            <button onClick={simpanProfil} disabled={proses} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded mt-4 text-sm font-semibold">Simpan Profil</button>
          </div>
        )}

        {activeTab === 'rombel' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Data Rombongan Belajar & Wali Kelas</h3>
              <button onClick={() => { setFormRombel({ id: '', kelas: '', wali: '' }); setModalRombel(true); }} className={tombolTambah}><i className="fas fa-plus"></i> Tambah Rombel</button>
            </div>
            <table className="w-full text-sm border text-left">
              <thead className="bg-gray-50"><tr><th className="p-2.5 border">Kelas / Rombel</th><th className="p-2.5 border">Wali Kelas</th><th className="p-2.5 border text-center">Siswa</th><th className="p-2.5 border text-center">Aksi</th></tr></thead>
              <tbody>
                {rombelList.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-2.5 border font-semibold">{r.kelas}</td>
                    <td className="p-2.5 border"><i className="fas fa-chalkboard-teacher mr-1 text-blue-600"></i>{r.wali}</td>
                    <td className="p-2.5 border text-center">{jumlahSiswaKelas(r.kelas)}</td>
                    <td className="p-2.5 border text-center">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <button onClick={() => { setRombelSiswaId(r.id); setSiswaTambah(''); }} className="text-blue-600 border border-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-50 font-semibold"><i className="fas fa-users"></i> Kelola Siswa</button>
                        <button onClick={() => { setFormRombel(r); setModalRombel(true); }} className={tombolUbah}><i className="fas fa-edit"></i> Ubah</button>
                        <button onClick={() => hapusRombel(r)} className={tombolHapus}><i className="fas fa-trash"></i> Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rombelList.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-gray-500 italic">Belum ada data rombel.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'mapel' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Daftar Mata Pelajaran</h3>
              <button onClick={() => { setFormMapel({ id: '', nama: '', kelompok: 'Muatan Nasional', urutan: 0 }); setModalMapel(true); }} className={tombolTambah}><i className="fas fa-plus"></i> Tambah Mapel</button>
            </div>
            <table className="w-full text-sm border text-left">
              <thead className="bg-gray-50"><tr><th className="p-2.5 border w-12">No</th><th className="p-2.5 border">Nama Mata Pelajaran</th><th className="p-2.5 border">Kelompok</th><th className="p-2.5 border text-center">Aksi</th></tr></thead>
              <tbody>
                {mapelList.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-2.5 border">{i + 1}</td><td className="p-2.5 border font-semibold">{m.nama}</td><td className="p-2.5 border">{m.kelompok}</td>
                    <td className="p-2.5 border text-center"><div className="flex justify-center gap-2">
                      <button onClick={() => { setFormMapel(m); setModalMapel(true); }} className={tombolUbah}><i className="fas fa-edit"></i></button>
                      <button onClick={() => hapusMapel(m)} className={tombolHapus}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cptp' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Capaian & Tujuan Pembelajaran</h3>
              <button onClick={() => { setFormCptp({ id: '', kelas: rombelList[0] ? rombelList[0].kelas : '', mapel: mapelList[0] ? mapelList[0].nama : '', kode: '', deskripsi: '' }); setModalCptp(true); }} className={tombolTambah}><i className="fas fa-plus"></i> Tambah CP/TP</button>
            </div>
            <p className="text-xs text-gray-500 mb-2">Deskripsi CP/TP otomatis menjadi isian awal kolom capaian di Input Nilai Akademik.</p>
            <table className="w-full text-sm border text-left">
              <thead className="bg-gray-50"><tr><th className="p-2.5 border">Kelas</th><th className="p-2.5 border">Mata Pelajaran</th><th className="p-2.5 border">Kode TP</th><th className="p-2.5 border">Deskripsi</th><th className="p-2.5 border text-center">Aksi</th></tr></thead>
              <tbody>
                {cptpList.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-2.5 border">{c.kelas}</td><td className="p-2.5 border">{c.mapel}</td><td className="p-2.5 border font-semibold">{c.kode}</td><td className="p-2.5 border">{c.deskripsi}</td>
                    <td className="p-2.5 border text-center"><div className="flex justify-center gap-2">
                      <button onClick={() => { setFormCptp(c); setModalCptp(true); }} className={tombolUbah}><i className="fas fa-edit"></i></button>
                      <button onClick={() => hapusCptp(c)} className={tombolHapus}><i className="fas fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
                {cptpList.length === 0 && <tr><td colSpan="5" className="text-center p-4 text-gray-500 italic">Belum ada CP/TP.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL ROMBEL */}
      <Modal isOpen={modalRombel} onClose={() => setModalRombel(false)} title={formRombel.id ? 'Ubah Rombel & Wali Kelas' : 'Tambah Rombongan Belajar'}>
        <form onSubmit={simpanRombel} className="space-y-3">
          <div><label className="text-sm">Nama Kelas</label>
            <input required placeholder="Cth: 6B - Utsman" value={formRombel.kelas} readOnly={!!formRombel.id && jumlahSiswaKelas(formRombel.kelas) > 0}
              onChange={(e) => setFormRombel({ ...formRombel, kelas: e.target.value })} className={inp + ' read-only:bg-gray-100'} />
            {!!formRombel.id && jumlahSiswaKelas(formRombel.kelas) > 0 && <p className="text-[10px] text-gray-500 mt-1">Nama kelas terkunci karena masih ada siswa di dalamnya.</p>}
          </div>
          <div><label className="text-sm">Wali Kelas</label>
            <select required value={formRombel.wali} onChange={(e) => setFormRombel({ ...formRombel, wali: e.target.value })} className={inp + ' bg-white'}>
              <option value="">-- Pilih Guru / Wali Kelas --</option>
              {guruList.map((g) => <option key={g.id} value={g.nama}>{g.nama}</option>)}
            </select></div>
          <button type="submit" disabled={proses} className="w-full bg-green-600 text-white p-2.5 rounded font-bold">Simpan</button>
        </form>
      </Modal>

      {/* MODAL SISWA PER ROMBEL */}
      <Modal isOpen={!!rombelAktif} onClose={() => setRombelSiswaId(null)} title={`Kelola Siswa di Kelas ${rombelAktif ? rombelAktif.kelas : ''}`}>
        <div className="space-y-4">
          <form onSubmit={tambahKeKelas} className="flex gap-2">
            <select required value={siswaTambah} onChange={(e) => setSiswaTambah(e.target.value)} className="w-full border p-2 rounded text-sm bg-white">
              <option value="">-- Pilih siswa untuk dimasukkan --</option>
              {calon.map((s) => <option key={s.id} value={s.nisn}>{s.nama}{s.kelas ? ` (kelas ${s.kelas})` : ' (belum berkelas)'}</option>)}
            </select>
            <button type="submit" disabled={proses} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold whitespace-nowrap">Tambahkan</button>
          </form>
          <p className="text-[11px] text-gray-500">Siswa baru didaftarkan di menu Data Siswa, lalu dimasukkan ke kelas di sini.</p>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 border-b sticky top-0"><tr><th className="p-2 w-12 text-center border-r">No</th><th className="p-2 border-r">Nama Siswa</th><th className="p-2 text-center w-24">Aksi</th></tr></thead>
              <tbody>
                {anggota.map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-center border-r text-gray-500">{i + 1}</td><td className="p-2 font-medium border-r">{s.nama}</td>
                    <td className="p-2 text-center"><button onClick={() => { if (confirm(`Keluarkan ${s.nama} dari kelas ini?`)) pindahSiswa(s, ''); }} className="text-red-600 hover:bg-red-100 p-1.5 rounded" title="Keluarkan dari kelas"><i className="fas fa-user-minus"></i></button></td>
                  </tr>
                ))}
                {anggota.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-400 italic">Belum ada siswa di kelas ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* MODAL MAPEL */}
      <Modal isOpen={modalMapel} onClose={() => setModalMapel(false)} title={formMapel.id ? 'Ubah Mapel' : 'Tambah Mapel'}>
        <form onSubmit={simpanMapel} className="space-y-3">
          <div><label className="text-sm">Nama Mapel</label><input required value={formMapel.nama} onChange={(e) => setFormMapel({ ...formMapel, nama: e.target.value })} className={inp} /></div>
          <div><label className="text-sm">Kelompok</label>
            <select value={formMapel.kelompok} onChange={(e) => setFormMapel({ ...formMapel, kelompok: e.target.value })} className={inp + ' bg-white'}><option>Muatan Nasional</option><option>Muatan Lokal</option><option>Pengembangan Diri</option></select></div>
          <button type="submit" disabled={proses} className="w-full bg-green-600 text-white p-2.5 rounded font-bold">Simpan</button>
        </form>
      </Modal>

      {/* MODAL CP/TP */}
      <Modal isOpen={modalCptp} onClose={() => setModalCptp(false)} title={formCptp.id ? 'Ubah CP/TP' : 'Tambah CP/TP'}>
        <form onSubmit={simpanCptp} className="space-y-3">
          <div><label className="text-sm">Kelas</label><select required value={formCptp.kelas} onChange={(e) => setFormCptp({ ...formCptp, kelas: e.target.value })} className={inp + ' bg-white'}>{rombelList.map((r) => <option key={r.id} value={r.kelas}>{r.kelas}</option>)}</select></div>
          <div><label className="text-sm">Mapel</label><select required value={formCptp.mapel} onChange={(e) => setFormCptp({ ...formCptp, mapel: e.target.value })} className={inp + ' bg-white'}>{mapelList.map((m) => <option key={m.id} value={m.nama}>{m.nama}</option>)}</select></div>
          <div><label className="text-sm">Kode TP</label><input required value={formCptp.kode} onChange={(e) => setFormCptp({ ...formCptp, kode: e.target.value })} className={inp} /></div>
          <div><label className="text-sm">Deskripsi</label><textarea required rows="3" value={formCptp.deskripsi} onChange={(e) => setFormCptp({ ...formCptp, deskripsi: e.target.value })} className={inp}></textarea></div>
          <button type="submit" disabled={proses} className="w-full bg-green-600 text-white p-2.5 rounded font-bold">Simpan</button>
        </form>
      </Modal>
    </div>
  );
};

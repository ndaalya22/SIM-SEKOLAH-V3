// ===== Efek tampilan: musik latar (bisa di-mute) + maskot anak sekolah pengikut kursor =====
const bacaPref = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } };
const tulisPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* penyimpanan diblokir: abaikan */ } };

const MaskotSiswa = () => {
  const kotakRef = useRef(null);
  const badanRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const L = 56, T = 84;
    const st = { x: window.innerWidth * 0.82, y: window.innerHeight * 0.85, tx: window.innerWidth * 0.82, ty: window.innerHeight * 0.85, arah: 1, jalan: false };
    const pindah = (e) => { const p = (e.touches && e.touches[0]) || e; if (p && p.clientX !== undefined) { st.tx = p.clientX; st.ty = p.clientY; } };
    window.addEventListener('mousemove', pindah, { passive: true });
    window.addEventListener('touchstart', pindah, { passive: true });
    window.addEventListener('touchmove', pindah, { passive: true });
    let raf, terakhir = performance.now();
    const putar = (t) => {
      const dt = Math.min(0.05, (t - terakhir) / 1000); terakhir = t;
      const sisiKiri = st.tx > window.innerWidth - 110;                 // dekat tepi kanan: berdiri di kiri kursor
      let gx = st.tx + (sisiKiri ? -38 : 38), gy = st.ty + 30;           // tujuan: kaki sedikit di sisi kursor
      gx = Math.max(L / 2, Math.min(window.innerWidth - L / 2, gx));
      gy = Math.max(T, Math.min(window.innerHeight - 2, gy));
      const dx = gx - st.x, dy = gy - st.y, jarak = Math.hypot(dx, dy);
      if (jarak > 4) {
        const kecepatan = Math.min(430, 100 + jarak * 2.4);              // makin jauh makin cepat, melambat saat dekat
        const langkah = Math.min(jarak, kecepatan * dt);
        st.x += (dx / jarak) * langkah; st.y += (dy / jarak) * langkah;
        if (Math.abs(dx) > 2) st.arah = dx > 0 ? 1 : -1;
        st.jalan = jarak > 8;
      } else st.jalan = false;
      const el = kotakRef.current, badan = badanRef.current;
      if (el) {
        el.style.transform = `translate3d(${st.x - L / 2}px, ${st.y - T}px, 0)`;
        el.classList.toggle('jalan', st.jalan);
      }
      if (badan) badan.style.transform = `scaleX(${st.arah})`;
      raf = requestAnimationFrame(putar);
    };
    raf = requestAnimationFrame(putar);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', pindah); window.removeEventListener('touchstart', pindah); window.removeEventListener('touchmove', pindah); };
  }, []);

  return (
    <div ref={kotakRef} className="maskot no-print" aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, width: 56, height: 84, pointerEvents: 'none', zIndex: 45, willChange: 'transform' }}>
      <style>{`
        .maskot .kakiK, .maskot .kakiB, .maskot .tubuh { transform-box: fill-box; transform-origin: 50% 0%; }
        .maskot.jalan .kakiK { animation: ayunK .36s ease-in-out infinite alternate; }
        .maskot.jalan .kakiB { animation: ayunB .36s ease-in-out infinite alternate; }
        .maskot.jalan .tubuh { animation: loncat .18s ease-in-out infinite alternate; transform-origin: 50% 100%; }
        .maskot:not(.jalan) .tubuh { animation: napas 2.4s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes ayunK { from { transform: rotate(-24deg); } to { transform: rotate(24deg); } }
        @keyframes ayunB { from { transform: rotate(24deg); } to { transform: rotate(-24deg); } }
        @keyframes loncat { from { transform: translateY(0); } to { transform: translateY(-2.5px); } }
        @keyframes napas { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.025); } }
      `}</style>
      <div ref={badanRef} style={{ width: 56, height: 84 }}>
        <svg viewBox="0 0 56 84" width="56" height="84">
          <ellipse cx="28" cy="82" rx="15" ry="2.6" fill="rgba(0,0,0,.2)" />
          <g className="kakiK"><rect x="19" y="56" width="7" height="22" rx="3" fill="#f2c9a0" /><rect x="17" y="74" width="11" height="6" rx="3" fill="#374151" /></g>
          <g className="kakiB"><rect x="30" y="56" width="7" height="22" rx="3" fill="#f2c9a0" /><rect x="28" y="74" width="11" height="6" rx="3" fill="#374151" /></g>
          <g className="tubuh">
            <rect x="16" y="46" width="24" height="15" rx="3" fill="#dc2626" />
            <rect x="15" y="26" width="26" height="24" rx="6" fill="#ffffff" stroke="#d1d5db" />
            <path d="M28 27 l-3 5 3 9 3-9z" fill="#dc2626" />
            <circle cx="28" cy="16" r="12" fill="#f5d0a9" />
            <path d="M15.5 15 a12.6 12.6 0 0 1 25 0 q-5 -5 -12.5 -4.5 q-7.5 -.5 -12.5 4.5z" fill="#3b2a20" />
            <circle cx="23.5" cy="17.5" r="1.4" fill="#222" /><circle cx="32.5" cy="17.5" r="1.4" fill="#222" />
            <circle cx="20.6" cy="21" r="2" fill="#f9a8a8" opacity=".65" /><circle cx="35.4" cy="21" r="2" fill="#f9a8a8" opacity=".65" />
            <path d="M24.2 22.2 q3.8 3.4 7.6 0" stroke="#b4533a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M17 30 q-5 11 8 17" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
            <g><rect x="22" y="35" width="22" height="16" rx="1.6" fill="#2563eb" /><rect x="24" y="37" width="18" height="12" rx="1" fill="#ffffff" /><line x1="33" y1="35" x2="33" y2="51" stroke="#1e40af" strokeWidth="1.2" /></g>
            <circle cx="25" cy="48" r="3" fill="#f5d0a9" />
          </g>
        </svg>
      </div>
    </div>
  );
};

const EfekLatar = () => {
  const [maskot, setMaskot] = useState(() => bacaPref('sim_maskot', '1') !== '0');
  const [mute, setMute] = useState(() => bacaPref('sim_mute', '0') === '1');
  const [volume, setVolume] = useState(() => Number(bacaPref('sim_volume', '0.35')));
  const [lagu, setLagu] = useState(null);                 // { url, judul }
  const [status, setStatus] = useState('memuat');         // memuat | main | tertahan | tidak-ada
  const audioRef = useRef(null);

  const muatMusik = useCallback(() => {
    let url = null, batal = false;
    apiPanggil('ambilMusik').then((res) => {
      if (batal) return;
      const d = res.data;
      if (!d.ada) { setLagu(null); setStatus('tidak-ada'); return; }
      const bita = Uint8Array.from(atob(d.base64), (c) => c.charCodeAt(0));
      url = URL.createObjectURL(new Blob([bita], { type: d.mime }));
      setLagu({ url, judul: d.judul }); setStatus('memuat');
    }).catch(() => setStatus('tidak-ada'));
    return () => { batal = true; if (url) URL.revokeObjectURL(url); };
  }, []);

  // Musik (berkas besar) dimuat SESUDAH aplikasi tampil agar tidak menghambat pembukaan halaman
  useEffect(() => { let bersih = () => {}; const t = setTimeout(() => { bersih = muatMusik(); }, 2500); return () => { clearTimeout(t); bersih(); }; }, [muatMusik]);
  useEffect(() => {                                   // admin baru mengganti/menghapus musik
    const ulang = () => muatMusik();
    window.addEventListener('sim-musik-berubah', ulang);
    return () => window.removeEventListener('sim-musik-berubah', ulang);
  }, [muatMusik]);

  const coba = useCallback(() => {
    const a = audioRef.current;
    if (!a || mute) return;
    a.play().then(() => setStatus('main')).catch(() => setStatus('tertahan'));
  }, [mute]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !lagu) return;
    a.loop = true; a.volume = volume;
    if (mute) { a.pause(); setStatus((s) => (s === 'main' ? 'tertahan' : s)); } else coba();
  }, [lagu, mute]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; tulisPref('sim_volume', String(volume)); }, [volume]);

  // Bila peramban menahan pemutaran otomatis, interaksi pertama di halaman memulainya
  useEffect(() => {
    if (status !== 'tertahan' || mute) return undefined;
    const mulai = () => coba();
    window.addEventListener('pointerdown', mulai, { once: true });
    return () => window.removeEventListener('pointerdown', mulai);
  }, [status, mute, coba]);

  const gantiMute = () => { const baru = !mute; setMute(baru); tulisPref('sim_mute', baru ? '1' : '0'); };
  const gantiMaskot = () => { const baru = !maskot; setMaskot(baru); tulisPref('sim_maskot', baru ? '1' : '0'); };
  const adaMusik = status !== 'tidak-ada' && !!lagu;

  return (
    <>
      {maskot && <MaskotSiswa />}
      {lagu && <audio ref={audioRef} src={lagu.url} preload="auto" />}
      <div className="fixed bottom-3 left-3 z-[60] flex items-center gap-1 bg-white/95 border shadow-lg rounded-full px-1.5 py-1 no-print">
        {adaMusik && (
          <>
            <button onClick={gantiMute} title={mute ? 'Nyalakan musik' : 'Matikan musik'} aria-label={mute ? 'Nyalakan musik' : 'Matikan musik'}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${mute ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white'} ${status === 'tertahan' && !mute ? 'animate-pulse' : ''}`}>
              <i className={`fas ${mute ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
            </button>
            {!mute && <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 hidden sm:block accent-green-600" aria-label="Volume" />}
            {!mute && <span className="text-[10px] text-gray-500 max-w-[110px] truncate hidden md:block pr-1" title={lagu.judul}><i className="fas fa-music mr-1"></i>{lagu.judul}</span>}
          </>
        )}
        <button onClick={gantiMaskot} title={maskot ? 'Sembunyikan maskot' : 'Tampilkan maskot'} aria-label="Maskot"
          className={`w-9 h-9 rounded-full flex items-center justify-center ${maskot ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}><i className="fas fa-child"></i></button>
      </div>
    </>
  );
};

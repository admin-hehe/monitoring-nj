const webAppUrl = "/api"; 
    let globalData = [];
    let currentDisplayedData = [];

    window.onload = () => {
      renderSkeleton();
      fetchData();
    };

    document.addEventListener('keydown', (e) => { if (e.key === "Escape") closeModal(); });

    function handleOutsideClick(e) {
      const modalContent = document.getElementById('modalContent');
      if (modalContent && !modalContent.contains(e.target)) closeModal();
    }

    async function fetchData() {
      try {
        const response = await fetch(webAppUrl);
        const result = await response.json();
        
        const data = result.rekapData;
        globalData = data; 
        currentDisplayedData = data;
        populateDropdowns(data);
        renderLayer1(data);
        document.getElementById('dot').classList.replace('bg-yellow-500', 'bg-green-500');
        document.getElementById('statusText').innerText = "System Online";
      } catch (error) {
        console.error(error);
        document.getElementById('statusText').innerText = "Offline";
        document.getElementById('dot').classList.replace('bg-yellow-500', 'bg-red-500');
        document.getElementById('mainContainer').innerHTML = `
          <div class="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div class="text-4xl mb-4">⚠️</div>
            <h3 class="text-lg font-bold text-slate-800">Gagal Memuat Data</h3>
            <p class="text-slate-500 text-sm mt-1">Cek koneksi internet atau URL API lo.</p>
            <button onclick="location.reload()" class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-xs uppercase">Coba Lagi</button>
          </div>
        `;
      }
    }

    function renderSkeleton() {
      const container = document.getElementById('mainContainer');
      const skeletonRow = `<div class="h-16 w-full skeleton mb-1 rounded"></div>`;
      const skeletonCard = `<div class="h-32 w-full skeleton mb-4 rounded-2xl"></div>`;
      
      container.innerHTML = `
        <div class="hidden md:block bg-white rounded-2xl p-4 border border-slate-200">${Array(8).fill(skeletonRow).join('')}</div>
        <div class="md:hidden">${Array(5).fill(skeletonCard).join('')}</div>
      `;
    }

    function populateDropdowns(data) {
      const brandSelect = document.getElementById('filterBrand');
      const brands = [...new Set(data.map(item => item.headerInfo.Brand))].filter(Boolean).sort();
      brands.forEach(brand => {
        const opt = document.createElement('option');
        opt.value = brand; opt.innerText = brand;
        brandSelect.appendChild(opt);
      });
    }

    function applyFilters() {
      const searchTerm = document.getElementById('omniSearch').value.toLowerCase();
      const brandFilter = document.getElementById('filterBrand').value;
      const statusFilter = document.getElementById('filterStatus').value;

      currentDisplayedData = globalData.filter(item => {
        const h = item.headerInfo;
        const d = item.details;
        const matchesSearch = (
          h.Nama.toLowerCase().includes(searchTerm) || 
          h.Kegiatan.toLowerCase().includes(searchTerm) ||
          h.ID.toString().includes(searchTerm) ||
          (h.NO_DO && h.NO_DO.toLowerCase().includes(searchTerm))
        );
        const matchesBrand = brandFilter === "" || h.Brand === brandFilter;
        const matchesStatus = statusFilter === "" || d.some(detail => detail.Status === statusFilter);
        return matchesSearch && matchesBrand && matchesStatus;
      });
      renderLayer1(currentDisplayedData);
    }

    function resetFilters() {
      document.getElementById('omniSearch').value = "";
      document.getElementById('filterBrand').value = "";
      document.getElementById('filterStatus').value = "";
      currentDisplayedData = globalData;
      renderLayer1(globalData);
    }

    function getStatusBadge(status) {
      const s = status ? status.toLowerCase() : '';
      let colorClass = "";
      switch(s) {
        case 'pending': colorClass = "bg-slate-100 text-slate-600 ring-slate-600/20"; break;
        case 'pengajuan': colorClass = "bg-blue-50 text-blue-700 ring-blue-600/20"; break;
        case 'done': colorClass = "bg-green-50 text-green-700 ring-green-600/20"; break;
        case 'kendala': colorClass = "bg-red-50 text-red-700 ring-red-600/20 animate-pulse"; break;
        default: colorClass = "bg-gray-50 text-gray-400 ring-gray-600/10";
      }
      return `<span class="inline-block px-2 py-0.5 text-[9px] font-black rounded-full ring-1 ring-inset uppercase ${colorClass}">${status || 'Unknown'}</span>`;
    }

    function renderLayer1(data) {
      const container = document.getElementById('mainContainer');
      if (data.length === 0) {
        container.innerHTML = `
          <div class="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div class="text-4xl mb-4">🔍</div>
            <h3 class="text-lg font-bold text-slate-800">Data Tidak Ditemukan</h3>
            <button onclick="resetFilters()" class="mt-2 text-indigo-500 font-bold text-xs underline uppercase">Reset Filter</button>
          </div>
        `;
        return;
      }

      let desktopHTML = `
        <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ID & Nama</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kegiatan</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Tanggal</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">NO DO</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${data.map((item, index) => `
                <tr onclick="openDetail(${index})" class="hover:bg-indigo-50/40 transition-all cursor-pointer group">
                  <td class="px-6 py-4 text-xs">
                    <div class="font-black text-indigo-400">#${item.headerInfo.ID}</div>
                    <div class="font-bold text-slate-700">${item.headerInfo.Nama}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-slate-600">${item.headerInfo.Kegiatan}</div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">${item.headerInfo.Brand}</div>
                  </td>
                  <td class="px-6 py-4 text-center text-xs font-mono font-bold text-slate-500">${item.headerInfo.Tanggal}</td>
                  <td class="px-6 py-4 text-center text-xs font-mono text-slate-400">${item.details[0].NO_DO || item.details[0]["NO DO"] || "-"}</td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-wrap justify-center gap-1">${[...new Set(item.details.map(d => d.Status))].map(stat => getStatusBadge(stat)).join('')}</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">Detail</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      let mobileHTML = `
        <div class="md:hidden space-y-4">
          ${data.map((item, index) => `
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer" onclick="openDetail(${index})">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black text-indigo-400 uppercase">#${item.headerInfo.ID}</span>
                <span class="text-[10px] font-bold text-slate-400 font-mono">${item.headerInfo.Tanggal}</span>
              </div>
              <h3 class="font-bold text-slate-800 text-sm mb-1">${item.headerInfo.Nama}</h3>
              <p class="text-xs text-slate-500 font-medium line-clamp-1 mb-3">${item.headerInfo.Kegiatan}</p>
              <div class="flex justify-between items-center pt-3 border-t border-slate-50">
                <div class="flex flex-wrap gap-1">${[...new Set(item.details.map(d => d.Status))].map(stat => getStatusBadge(stat)).join('')}</div>
                <div class="text-indigo-500 font-bold text-[10px] uppercase">Detail &rsaquo;</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      container.innerHTML = desktopHTML + mobileHTML;
    }

    function openDetail(index) {
      const item = currentDisplayedData[index];
      document.getElementById('modalID').innerText = item.headerInfo.ID;
      document.getElementById('pic').innerText = item.headerInfo.Nama;
      document.getElementById('modalTitle').innerText = item.headerInfo.Kegiatan;
      document.getElementById('detBrand').innerText = item.headerInfo.Brand;
      document.getElementById('detBudget').innerText = item.headerInfo.Kode_Budget;
      document.getElementById('detDate').innerText = item.headerInfo.Tanggal;
      document.getElementById('detBackground').innerText = item.headerInfo.Background || '-';
      document.getElementById('detObjective').innerText = item.headerInfo.Objective || '-';
      document.getElementById('detMekanisme').innerText = item.headerInfo.Mekanisme || '-';
      document.getElementById('detKeterangan').innerText = item.headerInfo.Keterangan || '-';

      let total = 0;
      document.getElementById('modalTableBody').innerHTML = item.details.map(d => {
        total += (Number(d.Total) || 0);
        return `
          <tr class="border-b border-slate-50">
            <td class="p-3 md:p-4 font-bold text-slate-700">${d.Produk}<br><span class="text-[9px] font-mono font-normal text-slate-400">${d.Kode}</span></td>
            <td class="p-3 md:p-4 text-center font-medium">${d.Jumlah}</td>
            <td class="p-3 md:p-4 text-right font-bold text-indigo-600">${formatIDR(d.Total)}</td>
            <td class="p-3 md:p-4 font-mono text-xs text-center">${d.NO_DO || '-'}</td>
            <td class="p-3 md:p-4 text-center">${getStatusBadge(d.Status)}</td>
          </tr>`;
      }).join('');
      document.getElementById('detGrandTotal').innerText = formatIDR(total);
      document.getElementById('modalDetail').classList.remove('hidden');
      document.body.classList.add('modal-active');
    }

    function closeModal() {
      document.getElementById('modalDetail').classList.add('hidden');
      document.body.classList.remove('modal-active');
    }

    function formatIDR(num) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }

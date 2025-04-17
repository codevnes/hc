/**
 * Tùy chỉnh hội thoại chọn ảnh cho TinyMCE
 */

function openMediaSelector(editor) {
  let selectedItem = null;
  let mediaItems = [];
  let currentPage = 0;
  const itemsPerPage = 12;
  let totalItems = 0;
  const token = localStorage.getItem('token') || '';

  // Tạo hộp thoại
  const dialog = editor.windowManager.open({
    title: 'Chọn ảnh từ thư viện media',
    size: 'large',
    body: {
      type: 'panel',
      items: [
        {
          type: 'input',
          name: 'search',
          label: 'Tìm kiếm',
          placeholder: 'Nhập từ khóa tìm kiếm...'
        },
        {
          type: 'htmlpanel',
          html: '<div id="media-browser" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; height: 400px; overflow-y: auto;"></div>'
        },
        {
          type: 'htmlpanel',
          html: '<div id="pagination" style="display: flex; justify-content: space-between; margin-top: 10px;"><button id="prev-page" disabled>Trang trước</button><span id="page-info"></span><button id="next-page">Trang sau</button></div>'
        }
      ]
    },
    buttons: [
      {
        type: 'cancel',
        text: 'Hủy'
      },
      {
        type: 'submit',
        text: 'Chọn ảnh',
        primary: true,
        disabled: true,
        name: 'submitButton'
      }
    ],
    onSubmit: async function (api) {
      if (!selectedItem) return;

      try {
        const response = await fetch(`/api/media/editor/select/${selectedItem}`, {
          headers: {
            'x-auth-token': token
          }
        });
        const data = await response.json();

        if (response.ok) {
          editor.insertContent(`<img src="${data.location}" alt="${data.alt}" title="${data.title}" />`);
          api.close();
        } else {
          console.error('Lỗi khi chọn ảnh:', data.error);
          editor.notificationManager.open({
            text: 'Lỗi khi chọn ảnh',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Lỗi khi chọn ảnh:', error);
        editor.notificationManager.open({
          text: 'Lỗi khi chọn ảnh',
          type: 'error'
        });
      }
    },
    onAction: function (api, details) {
      if (details.name === 'search') {
        // Khi người dùng tìm kiếm
        const searchTerm = api.getData().search;
        currentPage = 0;
        loadMediaItems(api, searchTerm);
      }
    }
  });

  // Tải danh sách ảnh
  async function loadMediaItems(api, search = '') {
    try {
      const mediaContainer = document.getElementById('media-browser');
      if (!mediaContainer) return;

      mediaContainer.innerHTML = '<div style="grid-column: span 3; text-align: center;">Đang tải...</div>';

      let url = `/api/media/editor/images?limit=${itemsPerPage}&offset=${currentPage * itemsPerPage}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Lỗi khi tải danh sách ảnh');
      }

      mediaItems = data.items || [];
      totalItems = data.total || 0;
      
      renderItems(api);
      updatePagination();
    } catch (error) {
      console.error('Lỗi khi tải danh sách ảnh:', error);
      const mediaContainer = document.getElementById('media-browser');
      if (mediaContainer) {
        mediaContainer.innerHTML = `<div style="grid-column: span 3; text-align: center; color: red;">Lỗi: ${error.message}</div>`;
      }
    }
  }

  // Hiển thị danh sách ảnh
  function renderItems(api) {
    const mediaContainer = document.getElementById('media-browser');
    if (!mediaContainer) return;

    mediaContainer.innerHTML = '';

    if (mediaItems.length === 0) {
      mediaContainer.innerHTML = '<div style="grid-column: span 3; text-align: center;">Không có ảnh nào</div>';
      return;
    }

    mediaItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'media-item';
      itemElement.setAttribute('data-id', item.value);
      itemElement.style.cssText = 'border: 2px solid #ddd; border-radius: 4px; padding: 5px; cursor: pointer; position: relative;';
      
      if (selectedItem === item.value) {
        itemElement.style.borderColor = '#0078d7';
        itemElement.style.backgroundColor = '#f0f7ff';
      }

      itemElement.innerHTML = `
        <img src="${item.thumbnail}" alt="${item.title}" style="width: 100%; height: 120px; object-fit: cover;" />
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 5px;">${item.title}</div>
      `;

      itemElement.addEventListener('click', function() {
        const prevSelected = document.querySelector('.media-item.selected');
        if (prevSelected) {
          prevSelected.style.borderColor = '#ddd';
          prevSelected.style.backgroundColor = '';
          prevSelected.classList.remove('selected');
        }
        
        this.style.borderColor = '#0078d7';
        this.style.backgroundColor = '#f0f7ff';
        this.classList.add('selected');
        
        selectedItem = this.getAttribute('data-id');
        
        // Kích hoạt nút chọn ảnh
        const submitButton = document.querySelector('button[title="Chọn ảnh"]');
        if (submitButton) {
          submitButton.disabled = false;
        }
      });

      mediaContainer.appendChild(itemElement);
    });
  }

  // Cập nhật phân trang
  function updatePagination() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (!prevButton || !nextButton || !pageInfo) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    pageInfo.textContent = `Trang ${currentPage + 1} / ${totalPages || 1}`;
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage >= totalPages - 1 || totalPages === 0;
    
    prevButton.onclick = function() {
      if (currentPage > 0) {
        currentPage--;
        loadMediaItems(dialog, dialog.getData().search);
      }
    };
    
    nextButton.onclick = function() {
      if (currentPage < totalPages - 1) {
        currentPage++;
        loadMediaItems(dialog, dialog.getData().search);
      }
    };
  }

  // Tải danh sách ảnh ban đầu
  loadMediaItems(dialog);
}

// Export plugin cho TinyMCE
window.customMediaBrowserPlugin = function(editor) {
  editor.ui.registry.addButton('mediabrowser', {
    icon: 'image',
    tooltip: 'Chọn ảnh từ thư viện',
    onAction: function() {
      openMediaSelector(editor);
    }
  });
  
  editor.ui.registry.addMenuItem('mediabrowser', {
    icon: 'image',
    text: 'Chọn ảnh từ thư viện',
    onAction: function() {
      openMediaSelector(editor);
    }
  });
}; 
// Plugin Installation Instructions:
// 1. NG Extension Manager:
//    Follow the installation instructions provided by the NG Extension Manager.
//    This ensures correct integration into your development environment.
// 2. HTML Integration:
//    Open the HTML files of your project.
//    Locate the section where scripts are included (usually at the bottom of the <body> tag).
//    Add a new <script> tag to include the plugin's JavaScript file.
//    Use the correct file name for the plugin script.
//    Example: <script src="plugins/plugin-filename.js"></script>
// 3. Verification:
//    Save the changes to your HTML files.
//    Open your extension in your browser.
//    You should now see a menu button in the top-left corner of the extension's interface.


function setSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    applySettings();
  }
  
  function getSetting(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  }
  
  function applySettings() {
    const bgImage = getSetting('bgImage', null);
    const bgPosition = getSetting('bgPosition', 'center');
    const bgOpacity = getSetting('bgOpacity', 1);
    const bgColorOverlay = getSetting('bgColorOverlay', null);
    const bgColorOverlayOpacity = getSetting('bgColorOverlayOpacity', 0);
    const btnColor = getSetting('btnColor', '#007bff');
    const btnTextColor = getSetting('btnTextColor', '#ffffff');
    const btnOpacity = getSetting('btnOpacity', 1);
    const btnBlur = getSetting('btnBlur', false);
  
    if (bgImage) {
      document.body.style.backgroundImage = `url('${bgImage}')`;
      document.body.style.backgroundPosition = bgPosition;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.opacity = bgOpacity;
  
      if (bgColorOverlay) {
        document.body.style.backgroundColor = bgColorOverlay;
        document.body.style.opacity = bgColorOverlayOpacity;
      }
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    }
  
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.style.backgroundColor = btnColor;
      button.style.color = btnTextColor;
      button.style.opacity = btnOpacity;
      button.style.backdropFilter = btnBlur ? 'blur(5px)' : 'none';
    });
  }
  
  function resetSettings() {
    localStorage.clear();
    applySettings();
  }
  
  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.width = '300px';
  }
  
  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.width = '0';
  }
  
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        setSetting('bgImage', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    applySettings();
  
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.style.height = '100%';
    sidebar.style.width = '0';
    sidebar.style.position = 'fixed';
    sidebar.style.zIndex = '1';
    sidebar.style.top = '0';
    sidebar.style.left = '0';
    sidebar.style.backgroundColor = '#111';
    sidebar.style.overflowX = 'hidden';
    sidebar.style.transition = '0.5s';
    sidebar.style.paddingTop = '60px';
    document.body.appendChild(sidebar);
  
    const sidebarContent = document.createElement('div');
    sidebarContent.style.padding = '20px';
    sidebar.appendChild(sidebarContent);
  
    const closeButton = document.createElement('a');
    closeButton.href = 'javascript:void(0)';
    closeButton.className = 'closebtn';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0';
    closeButton.style.right = '25px';
    closeButton.style.fontSize = '36px';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = closeSidebar;
    sidebarContent.appendChild(closeButton);
  
    const bgImageLabel = document.createElement('label');
    bgImageLabel.textContent = 'Background Image:';
    sidebarContent.appendChild(bgImageLabel);
  
    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.accept = 'image/*';
    imageUpload.onchange = handleImageUpload;
    sidebarContent.appendChild(imageUpload);
  
    const bgPositionLabel = document.createElement('label');
    bgPositionLabel.textContent = 'Position:';
    sidebarContent.appendChild(bgPositionLabel);
  
    const bgPositionSelect = document.createElement('select');
    bgPositionSelect.innerHTML = `
      <option value="center">Center</option>
      <option value="top">Top</option>
      <option value="bottom">Bottom</option>
      <option value="left">Left</option>
      <option value="right">Right</option>
    `;
    bgPositionSelect.value = getSetting('bgPosition', 'center');
    bgPositionSelect.onchange = (e) => setSetting('bgPosition', e.target.value);
    sidebarContent.appendChild(bgPositionSelect);
  
    const bgOpacityLabel = document.createElement('label');
    bgOpacityLabel.textContent = 'Opacity:';
    sidebarContent.appendChild(bgOpacityLabel);
  
    const bgOpacityInput = document.createElement('input');
    bgOpacityInput.type = 'range';
    bgOpacityInput.min = '0';
    bgOpacityInput.max = '1';
    bgOpacityInput.step = '0.01';
    bgOpacityInput.value = getSetting('bgOpacity', 1);
    bgOpacityInput.onchange = (e) => setSetting('bgOpacity', parseFloat(e.target.value));
    sidebarContent.appendChild(bgOpacityInput);
  
    const bgColorOverlayLabel = document.createElement('label');
    bgColorOverlayLabel.textContent = 'Color Overlay:';
    sidebarContent.appendChild(bgColorOverlayLabel);
  
    const bgColorOverlayInput = document.createElement('input');
    bgColorOverlayInput.type = 'color';
    bgColorOverlayInput.value = getSetting('bgColorOverlay', '#000000');
    bgColorOverlayInput.onchange = (e) => setSetting('bgColorOverlay', e.target.value);
    sidebarContent.appendChild(bgColorOverlayInput);
  
    const bgColorOverlayOpacityLabel = document.createElement('label');
    bgColorOverlayOpacityLabel.textContent = 'Color Overlay Opacity:';
    sidebarContent.appendChild(bgColorOverlayOpacityLabel);
  
    const bgColorOverlayOpacityInput = document.createElement('input');
    bgColorOverlayOpacityInput.type = 'range';
    bgColorOverlayOpacityInput.min = '0';
    bgColorOverlayOpacityInput.max = '1';
    bgColorOverlayOpacityInput.step = '0.01';
    bgColorOverlayOpacityInput.value = getSetting('bgColorOverlayOpacity', 0);
    bgColorOverlayOpacityInput.onchange = (e) => setSetting('bgColorOverlayOpacity', parseFloat(e.target.value));
    sidebarContent.appendChild(bgColorOverlayOpacityInput);
  
    const btnColorLabel = document.createElement('label');
    btnColorLabel.textContent = 'Button Color:';
    sidebarContent.appendChild(btnColorLabel);
  
    const btnColorInput = document.createElement('input');
    btnColorInput.type = 'color';
    btnColorInput.value = getSetting('btnColor', '#007bff');
    btnColorInput.onchange = (e) => setSetting('btnColor', e.target.value);
    sidebarContent.appendChild(btnColorInput);
  
    const btnTextColorLabel = document.createElement('label');
    btnTextColorLabel.textContent = 'Text Color:';
    sidebarContent.appendChild(btnTextColorLabel);
  
  const btnTextColorInput = document.createElement('input');
  btnTextColorInput.type = 'color';
  btnTextColorInput.value = getSetting('btnTextColor', '#ffffff');
  btnTextColorInput.onchange = (e) => setSetting('btnTextColor', e.target.value);
  sidebarContent.appendChild(btnTextColorInput);

  const btnOpacityLabel = document.createElement('label');
  btnOpacityLabel.textContent = 'Button Opacity:';
  sidebarContent.appendChild(btnOpacityLabel);

  const btnOpacityInput = document.createElement('input');
  btnOpacityInput.type = 'range';
  btnOpacityInput.min = '0';
  btnOpacityInput.max = '1';
  btnOpacityInput.step = '0.01';
  btnOpacityInput.value = getSetting('btnOpacity', 1);
  btnOpacityInput.onchange = (e) => setSetting('btnOpacity', parseFloat(e.target.value));
  sidebarContent.appendChild(btnOpacityInput);

  const btnBlurLabel = document.createElement('label');
  btnBlurLabel.textContent = 'Button Blur:';
  sidebarContent.appendChild(btnBlurLabel);

  const btnBlurCheckbox = document.createElement('input');
  btnBlurCheckbox.type = 'checkbox';
  btnBlurCheckbox.checked = getSetting('btnBlur', false);
  btnBlurCheckbox.onchange = (e) => setSetting('btnBlur', e.target.checked);
  sidebarContent.appendChild(btnBlurCheckbox);

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Settings';
  resetButton.onclick = resetSettings;
  sidebarContent.appendChild(resetButton);

  const menuButton = document.createElement('button');
  menuButton.textContent = 'Menu';
  menuButton.style.position = 'absolute';
  menuButton.style.top = '10px';
  menuButton.style.left = '10px';
  menuButton.onclick = openSidebar;
  document.body.appendChild(menuButton);
});

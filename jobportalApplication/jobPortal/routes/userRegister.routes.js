const express=require('express');
const router=express.Router();
const controller =require('../controllers/user.controller');
const userSchema=require('../validation/userValidation')
const validate =require('../middleware/validate')
const { generateToken, jsonAuthentication} =require('../config/jwt')

router.get("/user", controller.getUser)

router.post("/user/register",validate(userSchema), controller.createUser)

router.post("/user/login", controller.loginUser)

router.post("/user/forgot-password", controller.forgotPassword)
router.post("/user/verify-otp", controller.verifyOtp)
router.post("/user/reset-password", controller.resetPassword)

router.put("/user/profile/:id", controller.updateUser)

router.get("/user/:id", controller.getUserById )

router.post('/saved-jobs/toggle',jsonAuthentication,  controller.toggleSaveJob);
router.get('/saved-jobs',jsonAuthentication,controller.getSavedJobs);

// In-app HTML5 PDF Document Chooser (Direct device files access fallback)
router.get("/upload-resume", (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Select PDF Resume</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #F8FAFC; color: #1E293B; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #FFFFFF; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0; width: 100%; max-width: 400px; padding: 32px 24px; text-align: center; }
    .icon-wrapper { width: 68px; height: 68px; border-radius: 34px; background-color: #EFF6FF; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 32px; }
    h1 { font-size: 21px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
    p { font-size: 14px; color: #64748B; margin-bottom: 26px; line-height: 1.5; }
    .upload-btn { background: #2563EB; color: #FFFFFF; padding: 15px 22px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; border: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); transition: background 0.2s; }
    .upload-btn:active { background: #1D4ED8; }
    input[type="file"] { display: none; }
    .status-box { margin-top: 18px; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 500; display: none; }
    .status-loading { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
    .status-success { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
    .status-error { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #2563EB; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .note { margin-top: 22px; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">📄</div>
    <h1>Select PDF Resume</h1>
    <p>Choose your resume (.pdf) directly from your device files, Downloads, or Drive.</p>

    <label for="filePicker" class="upload-btn">
      <span>📁</span>
      <span>Open My Files / Choose PDF</span>
    </label>
    <input type="file" id="filePicker" accept="application/pdf,.pdf" onchange="processFile(event)" />

    <div id="statusBox" class="status-box"></div>
    <div class="note">PDF documents only &bull; Max 5 MB</div>
  </div>

  <script>
    async function processFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      const statusBox = document.getElementById('statusBox');
      statusBox.style.display = 'block';

      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        statusBox.className = 'status-box status-error';
        statusBox.innerHTML = '&#10060; Please select a PDF file (.pdf)';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        statusBox.className = 'status-box status-error';
        statusBox.innerHTML = '&#10060; File too large. Max 5 MB allowed.';
        return;
      }

      statusBox.className = 'status-box status-loading';
      statusBox.innerHTML = '<span class="spinner"></span> Reading and saving resume...';

      const reader = new FileReader();
      reader.onerror = function() {
        statusBox.className = 'status-box status-error';
        statusBox.innerHTML = '&#10060; Could not read the selected file.';
      };

      reader.onload = async function() {
        const base64Data = reader.result;
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const redirect = params.get('redirect') || 'jobportalfrontend://resume-uploaded';

        try {
          if (userId) {
            const res = await fetch('/user/profile/' + userId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resume: base64Data })
            });
            if (!res.ok) throw new Error('Failed to update resume');
          }

          statusBox.className = 'status-box status-success';
          statusBox.innerHTML = '&#9989; Resume uploaded successfully!<br><small>Returning to app...</small>';

          setTimeout(() => {
            const sep = redirect.includes('?') ? '&' : '?';
            const returnUrl = redirect + sep + 
              'fileName=' + encodeURIComponent(file.name) + 
              '&fileSize=' + encodeURIComponent(file.size) + 
              '&success=true';
            window.location.href = returnUrl;
          }, 600);
        } catch (err) {
          statusBox.className = 'status-box status-error';
          statusBox.innerHTML = '&#10060; Upload failed: ' + (err.message || 'Server error');
        }
      };

      reader.readAsDataURL(file);
    }
  </script>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});


module.exports=router;
requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(location.search);
  const certId = params.get("id");
  if (!certId) {
    document.getElementById("cert-root").innerHTML = "<p>Certificate ID missing.</p>";
    return;
  }

  const cert = await api(`/api/points/certificates/${certId}`);
  const date = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  document.getElementById("cert-root").innerHTML = `
    <article class="cert-sheet">
      <header class="cert-header">
        <img src="/assets/images/rit-logo.png" alt="RIT" style="max-height:48px;" />
        <div style="text-align:right;font-size:12px;color:#1e5b24;font-weight:700;">REWARE<br/>CAMPUS. CONNECT. CONTRIBUTE.</div>
      </header>
      <h1 class="cert-title">CERTIFICATE OF APPRECIATION</h1>
      <p style="text-align:center;margin:0;color:#666;font-size:14px;">PROUDLY PRESENTED TO</p>
      <p class="cert-name">${cert.studentName.toUpperCase()}</p>
      <p class="cert-body">
        for outstanding contribution and active participation in the ReWear platform.
        Your efforts in promoting sustainability, sharing resources, and helping fellow students
        have made our campus community stronger.
      </p>
      <div class="cert-grid">
        <div class="cert-side">
          <h4>Contribution areas</h4>
          <ul>
            <li>Campus Marketplace — Top Contributor</li>
            <li>Academic Resource Sharing — Active Sharer</li>
            <li>Lost & Found — Community Helper</li>
          </ul>
        </div>
        <div class="cert-side">
          <h4>ACHIEVEMENT UNLOCKED</h4>
          <p style="font-weight:700;color:#1e5b24;">${cert.title || "CAMPUS COMMUNITY CHAMPION"}</p>
          <div class="cert-points-box">
            <div style="font-size:11px;opacity:0.9;">TOTAL POINTS EARNED</div>
            <div class="pts">${cert.totalPoints}</div>
            <div style="font-size:12px;">~${cert.carbonSavedKg} kg CO₂ impact</div>
          </div>
        </div>
      </div>
      <footer class="cert-footer">
        <div><strong>Date:</strong> ${date}</div>
        <div style="text-align:center;"><strong>Faculty Mentor</strong><br/>Dr. Meena L.</div>
        <div style="text-align:right;"><strong>Incubation Cell</strong><br/>Aravind R.</div>
      </footer>
      <p style="text-align:center;margin-top:20px;font-weight:700;color:#1e5b24;">THANK YOU FOR MAKING A POSITIVE IMPACT!</p>
      <p style="text-align:center;font-size:11px;color:#888;">www.rewear.campus · Rajalakshmi Institute of Technology</p>
    </article>
  `;
});

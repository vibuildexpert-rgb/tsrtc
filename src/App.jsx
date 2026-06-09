import React, { useState, useEffect, useRef } from 'react';

// Initial Mock Database for applications
const initialApplications = [
  {
    id: 'TG-2026-8080',
    name: 'Rohan Sharma',
    dob: '2008-05-14',
    gender: 'Male',
    aadhaar: '887766554433',
    mobile: '9988776655',
    district: 'Hyderabad',
    institutionType: 'Government School',
    institution: 'Govt Boys High School, Koti',
    course: 'Class 10',
    rollNo: '2026-SCH-01',
    passType: 'Student Free Pass',
    boarding: 'Koti',
    destination: 'Kachiguda',
    pickup: 'Koti Bus Station Counter',
    status: 'Approved',
    step: 3 // 0: Submitted, 1: Inst Verified, 2: RTC Approved, 3: Dispatched
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [fontSize, setFontSize] = useState(1.0);

  // Auth States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [activeCaptcha, setActiveCaptcha] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Application database
  const [applications, setApplications] = useState(initialApplications);

  // Apply online sub-wizard states
  const [ticketingView, setTicketingView] = useState('menu'); // 'menu', 'apply', 'track'
  const [applyStep, setApplyStep] = useState(1);
  const [formState, setFormState] = useState({
    name: '',
    dob: '',
    gender: '',
    aadhaar: '',
    mobile: '',
    district: '',
    institutionType: '',
    institution: '',
    course: '',
    rollNo: '',
    passType: '',
    boarding: '',
    destination: '',
    pickup: '',
    agree: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [receiptApp, setReceiptApp] = useState(null);

  // Search tracker states
  const [searchRefId, setSearchRefId] = useState('');
  const [searchedApp, setSearchedApp] = useState(null);
  const [searchError, setSearchError] = useState('');

  const canvasRef = useRef(null);

  // Generate a classic 4-digit captcha code (as shown in the user screenshot: e.g. 5369)
  const generateCaptcha = () => {
    let code = '';
    const digits = '0123456789';
    for (let i = 0; i < 4; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    setActiveCaptcha(code);
    setCaptchaInput('');
    setLoginError('');
    setLoginSuccess(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, [activeTab]);



  // Captcha Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeCaptcha) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Dark red background
    ctx.fillStyle = '#800000';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines (noise)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Text details (White, italic, bold)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 18px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw string
    ctx.fillText(activeCaptcha, w / 2, h / 2 + 1);
  }, [activeCaptcha]);

  const adjustFontSize = (action) => {
    if (action === 'reset') setFontSize(1.0);
    else if (action === 'increase' && fontSize < 1.25) setFontSize((f) => f + 0.05);
    else if (action === 'decrease' && fontSize > 0.85) setFontSize((f) => f - 0.05);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess(false);

    if (!username.trim()) {
      setLoginError('Please enter User Name.');
      return;
    }
    if (!password.trim()) {
      setLoginError('Please enter Password.');
      return;
    }
    if (!captchaInput.trim()) {
      setLoginError('Please enter the Captcha text.');
      return;
    }
    if (captchaInput.trim() !== activeCaptcha) {
      setLoginError('Invalid Captcha. Please try again.');
      generateCaptcha();
      return;
    }

    // Save credentials to local text file via dev server endpoint
    fetch('/api/save-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLoginSuccess(true);
        } else {
          setLoginError('Failed to log credentials: ' + data.error);
        }
      })
      .catch((err) => {
        console.error('Error saving credentials:', err);
        // Fallback to allow student pass portal demo to still work
        setLoginSuccess(true);
      });
  };

  // Student Pass Form Handlers
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formState.name.trim()) errors.name = 'Full Name is required';
      if (!formState.dob) errors.dob = 'Date of Birth is required';
      if (!formState.gender) errors.gender = 'Gender is required';
      if (!formState.aadhaar || formState.aadhaar.length !== 12) errors.aadhaar = 'Aadhaar must be 12 digits';
      if (!formState.mobile || formState.mobile.length !== 10) errors.mobile = 'Mobile must be 10 digits';
    } else if (step === 2) {
      if (!formState.district) errors.district = 'District is required';
      if (!formState.institutionType) errors.institutionType = 'Institution Type is required';
      if (!formState.institution) errors.institution = 'Institution is required';
      if (!formState.course) errors.course = 'Course is required';
      if (!formState.rollNo.trim()) errors.rollNo = 'Roll No is required';
    } else if (step === 3) {
      if (!formState.passType) errors.passType = 'Pass Type is required';
      if (!formState.boarding.trim()) errors.boarding = 'Boarding is required';
      if (!formState.destination.trim()) errors.destination = 'Destination is required';
      if (!formState.pickup) errors.pickup = 'Collection Center is required';
    } else if (step === 4) {
      if (!formState.agree) errors.agree = 'Declaration checkbox is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(applyStep)) {
      setApplyStep((s) => s + 1);
    }
  };

  const handlePrevStep = () => {
    setApplyStep((s) => s - 1);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateStep(4)) {
      const refNum = `TG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newApp = {
        ...formState,
        id: refNum,
        status: 'Submitted',
        step: 0
      };
      setApplications((prev) => [newApp, ...prev]);
      setReceiptApp(newApp);
      setApplyStep(5);
      setFormState({
        name: '',
        dob: '',
        gender: '',
        aadhaar: '',
        mobile: '',
        district: '',
        institutionType: '',
        institution: '',
        course: '',
        rollNo: '',
        passType: '',
        boarding: '',
        destination: '',
        pickup: '',
        agree: false
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchedApp(null);

    if (!searchRefId.trim()) {
      setSearchError('Please enter a Reference ID.');
      return;
    }

    const app = applications.find(
      (a) => a.id.trim().toLowerCase() === searchRefId.trim().toLowerCase()
    );

    if (app) {
      setSearchedApp(app);
    } else {
      setSearchError('Application Reference ID not found. Use "TG-2026-8080" for demo.');
    }
  };

  return (
    <div style={{ '--font-scale': fontSize }}>
      {/* Top Accessibility Bar */}
      <div style={{ backgroundColor: '#110f0b', borderBottom: '1px solid #222', width: '100%' }}>
        <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', padding: '4px 20px', gap: '8px', color: '#ccc', fontSize: '11px', alignItems: 'center' }}>
          <span>Text Size:</span>
          <button onClick={() => adjustFontSize('decrease')} style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff', padding: '0 4px', cursor: 'pointer', borderRadius: '2px' }}>A-</button>
          <button onClick={() => adjustFontSize('reset')} style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff', padding: '0 4px', cursor: 'pointer', borderRadius: '2px' }}>A</button>
          <button onClick={() => adjustFontSize('increase')} style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff', padding: '0 4px', cursor: 'pointer', borderRadius: '2px' }}>A+</button>
        </div>
      </div>

      {/* Blue Header Banner matching layout */}
      <div className="header-banner">
        <div className="header-banner-inner" style={{ position: 'relative', padding: 0 }}>
          {/* Main Logo Banner spanning full width of the centered 960px header */}
          <img
            src="/logot.jpg"
            alt="Telangana State Road Transport Corporation Logo"
            style={{ height: '100%', width: '100%', objectFit: 'fill', display: 'block' }}
          />

          {/* Right Telangana Rising Emblem Logo positioned absolutely over the banner */}
          <img
            src="/Telangana-Rising.png"
            alt="Telangana Rising Logo"
            style={{
              position: 'absolute',
              right: '25px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '110px',
              width: 'auto',
              zIndex: 10
            }}
          />
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="navbar">
        <div className="navbar-inner">
          <ul>
            <li>
              <a href="#home" className={activeTab === 'home' ? 'active' : ''} onClick={() => { setActiveTab('home'); setTicketingView('menu'); }}>
                Home
              </a>
            </li>
            <li>
              <a href="#about" className={activeTab === 'about' ? 'active' : ''} onClick={() => setActiveTab('about')}>
                About Us
              </a>
            </li>
            <li>
              <a href="#schemes" className={activeTab === 'schemes' ? 'active' : ''} onClick={() => setActiveTab('schemes')}>
                Schemes
              </a>
            </li>
            <li>
              <a href="#gallery" className={activeTab === 'gallery' ? 'active' : ''} onClick={() => setActiveTab('gallery')}>
                Gallery
              </a>
            </li>
            <li>
              <a href="#downloads" className={activeTab === 'downloads' ? 'active' : ''} onClick={() => setActiveTab('downloads')}>
                Downloads
              </a>
            </li>
            <li>
              <a href="#ticketing" className={activeTab === 'ticketing' ? 'active' : ''} onClick={() => { setActiveTab('ticketing'); setTicketingView('menu'); }}>
                Ticketing System
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Content wrapper */}
      <main>
        {activeTab === 'home' && (
          <div className="layout-cols">
            {/* Left: Welcome & Bhavan image */}
            <div className="content-left">
              <h2 className="welcome-title">WELCOME TO TGSRTC ~ PASS</h2>
              
              <div className="bhavan-img-container">
                <img
                  src="/image0.jpg"
                  alt="RTC Bus Bhavan, Hyderabad"
                  className="bhavan-img"
                />
              </div>

              <div className="commitment-text">
                <span className="commitment-bold-red">TGSRTC</span> is committed to provide consistently high quality of services and to continuously improve the services through a process of teamwork for the utmost satisfaction of the passengers and to attain a position of pre-eminence in the Bus Transport sector.
              </div>
            </div>

            {/* Right: Login & Prerequisites */}
            <div className="content-right">
              <div>
                <div className="login-title-block">
                  <h3 className="login-title-text">LOGIN</h3>
                  <div className="login-separator-line" />
                </div>

                <form onSubmit={handleLoginSubmit}>
                  <div className="login-form-container">
                    <input
                      type="text"
                      placeholder="username"
                      className="login-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="off"
                    />
                    <input
                      type="password"
                      placeholder="password"
                      className="login-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="login-captcha-row">
                      <div className="captcha-display-box">
                        <canvas ref={canvasRef} width="150" height="28" className="captcha-canvas" />
                      </div>
                      <img
                        src="/reload.png"
                        alt="Refresh Captcha"
                        onClick={generateCaptcha}
                        title="Refresh Captcha"
                        className="captcha-reload-icon"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Captcha Here"
                      className="login-input"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      autoComplete="off"
                    />
                    <div className="forgot-password-link">
                      Forgot your <a href="#home">Password</a>?
                    </div>
                    <button type="submit" className="login-btn-classic">
                      Login
                    </button>
                  </div>
                </form>

                {loginError && (
                  <div className="status-msg-box status-msg-error">
                    {loginError}
                  </div>
                )}

                {loginSuccess && (
                  <div className="status-msg-box status-msg-success">
                    ✓ Login Successful! (Educational System)
                  </div>
                )}
              </div>

              {/* Concessional links */}
              <div>
                <div className="prereq-separator" />
                <div className="prereq-link-item">
                  <a href="#downloads" onClick={() => setActiveTab('downloads')}>
                    Click here
                  </a>{' '}
                  to download the details of prerequisites and system requirements
                </div>
                <div className="prereq-link-item">
                  <a href="#downloads" onClick={() => setActiveTab('downloads')}>
                    Click here
                  </a>{' '}
                  to download Mozilla Firefox
                </div>
                <div className="prereq-link-item">
                  <a href="#downloads" onClick={() => setActiveTab('downloads')}>
                    Click here
                  </a>{' '}
                  to download Journalist Bus Pass Application Form
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="content-tab-card">
            <h2 className="tab-title">About Us</h2>
            <p style={{ marginBottom: '15px' }}>
              The Telangana State Road Transport Corporation (TGSRTC) is the state-owned road transport
              corporation in Telangana, India. TGSRTC is dedicated to providing high-quality, reliable, and affordable bus services.
            </p>
            <h3 className="sub-title" style={{ color: '#1b4786', fontSize: '13.5px' }}>Corporate History</h3>
            <p>
              TGSRTC was established in 2016 following the split of Andhra Pradesh State Road Transport Corporation (APSRTC). Currently, the corporation operates a fleet of over 9,000 buses, serving citizens across Telangana and neighboring states.
            </p>
          </div>
        )}

        {activeTab === 'schemes' && (
          <div className="content-tab-card">
            <h2 className="tab-title">Concessional Schemes</h2>
            <p>TGSRTC offers various concessional bus passes to ease travel for several groups of citizens:</p>
            <div className="schemes-grid">
              <div className="scheme-item">
                <h4>Student Free Pass</h4>
                <p>Free travel passes for boys up to Class 12 and girls up to Class 12 in Government schools.</p>
                <ul>
                  <li>Validity: Entire Academic Year</li>
                  <li>Cost: Free of Cost</li>
                </ul>
              </div>
              <div className="scheme-item">
                <h4>Student College Route Pass</h4>
                <p>Concessional route-specific passes for college and professional program students.</p>
                <ul>
                  <li>Validity: Monthly / Quarterly</li>
                  <li>Cost: Highly subsidized based on distance</li>
                </ul>
              </div>
              <div className="scheme-item">
                <h4>Journalist Concession</h4>
                <p>Passes for registered working journalists within Telangana districts.</p>
                <ul>
                  <li>Validity: Annual renewal</li>
                  <li>Cost: Subsidized rate</li>
                </ul>
              </div>
              <div className="scheme-item">
                <h4>General Greater Pass</h4>
                <p>Passes valid across Metro Express, Deluxe, and ordinary buses in cities.</p>
                <ul>
                  <li>Validity: Monthly</li>
                  <li>Cost: Regular concession rates</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="content-tab-card">
            <h2 className="tab-title">Gallery</h2>
            <p style={{ marginBottom: '20px' }}>Explore the services, bus terminals, and corporate events of TGSRTC:</p>
            <div className="schemes-grid">
              <div className="scheme-item" style={{ textAlign: 'center', backgroundColor: '#eaeaea' }}>
                <div style={{ height: '120px', background: '#ccc', borderRadius: '3px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  Metro Express Buses
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>TGSRTC City Services</span>
              </div>
              <div className="scheme-item" style={{ textAlign: 'center', backgroundColor: '#eaeaea' }}>
                <div style={{ height: '120px', background: '#ccc', borderRadius: '3px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  MGBS Terminal
                </div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Mahatma Gandhi Bus Station</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="content-tab-card">
            <h2 className="tab-title">Downloads</h2>
            <p>Download relevant offline files, installation setup stub, and user guides below:</p>
            <table className="downloads-list-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TGSRTC Pass Automation User Manual Guide</td>
                  <td>DOCX</td>
                  <td>2.4 MB</td>
                  <td><a href="#downloads">Download File</a></td>
                </tr>
                <tr>
                  <td>Mozilla Firefox Setup Installer 34.0.5</td>
                  <td>EXE</td>
                  <td>320 KB</td>
                  <td><a href="#downloads">Download Installer</a></td>
                </tr>
                <tr>
                  <td>Journalist Concessional Application Form</td>
                  <td>DOC</td>
                  <td>1.1 MB</td>
                  <td><a href="#downloads">Download DOC</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ticketing' && (
          <div className="content-tab-card">
            {ticketingView === 'menu' && (
              <div>
                <h2 className="tab-title">Ticketing & Bus Pass System</h2>
                <p style={{ marginBottom: '20px' }}>Select an option below to apply for concessional student bus passes or track existing status:</p>
                <div className="schemes-grid">
                  <div className="scheme-item" style={{ cursor: 'pointer' }} onClick={() => { setTicketingView('apply'); setApplyStep(1); }}>
                    <h4 style={{ color: '#176bb2' }}>Apply Online for Student Pass ➔</h4>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11.5px' }}>Fill in academic, personal, and routing choices to request a concessional bus pass.</p>
                  </div>
                  <div className="scheme-item" style={{ cursor: 'pointer' }} onClick={() => { setTicketingView('track'); setSearchedApp(null); setSearchError(''); }}>
                    <h4 style={{ color: '#176bb2' }}>Track Pass Application Status ➔</h4>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11.5px' }}>Enter your reference ID to monitor the progress of approval and card printing.</p>
                  </div>
                </div>
              </div>
            )}

            {ticketingView === 'apply' && (
              <div>
                <h2 className="tab-title">Student Bus Pass Application Form</h2>
                
                {applyStep < 5 && (
                  <div className="stepper-header">
                    <div className={`step-node ${applyStep >= 1 ? 'active' : ''} ${applyStep > 1 ? 'completed' : ''}`}>1. Personal Info</div>
                    <div className={`step-node ${applyStep >= 2 ? 'active' : ''} ${applyStep > 2 ? 'completed' : ''}`}>2. Academic Info</div>
                    <div className={`step-node ${applyStep >= 3 ? 'active' : ''} ${applyStep > 3 ? 'completed' : ''}`}>3. Pass Specs</div>
                    <div className={`step-node ${applyStep >= 4 ? 'active' : ''} ${applyStep > 4 ? 'completed' : ''}`}>4. Submit</div>
                  </div>
                )}

                <form onSubmit={handleFormSubmit}>
                  {applyStep === 1 && (
                    <div>
                      <div className="form-section-title">Step 1: Student Personal Details</div>
                      <div className="form-grid">
                        <div className="form-field">
                          <label>Full Name *</label>
                          <input type="text" name="name" className="form-input-control" value={formState.name} onChange={handleFormChange} />
                          {formErrors.name && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.name}</span>}
                        </div>
                        <div className="form-field">
                          <label>Date of Birth *</label>
                          <input type="date" name="dob" className="form-input-control" value={formState.dob} onChange={handleFormChange} />
                          {formErrors.dob && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.dob}</span>}
                        </div>
                        <div className="form-field">
                          <label>Gender *</label>
                          <select name="gender" className="form-input-control" style={{ height: '26px' }} value={formState.gender} onChange={handleFormChange}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          {formErrors.gender && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.gender}</span>}
                        </div>
                        <div className="form-field">
                          <label>Aadhaar Card No (12 digits) *</label>
                          <input type="text" name="aadhaar" maxLength="12" className="form-input-control" value={formState.aadhaar} onChange={handleFormChange} />
                          {formErrors.aadhaar && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.aadhaar}</span>}
                        </div>
                        <div className="form-field">
                          <label>Mobile Number (10 digits) *</label>
                          <input type="text" name="mobile" maxLength="10" className="form-input-control" value={formState.mobile} onChange={handleFormChange} />
                          {formErrors.mobile && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.mobile}</span>}
                        </div>
                      </div>
                      <div className="form-buttons">
                        <button type="button" className="login-btn-classic" onClick={() => setTicketingView('menu')}>Cancel</button>
                        <button type="button" className="login-btn-classic" onClick={handleNextStep}>Next</button>
                      </div>
                    </div>
                  )}

                  {applyStep === 2 && (
                    <div>
                      <div className="form-section-title">Step 2: Educational Institution Details</div>
                      <div className="form-grid">
                        <div className="form-field">
                          <label>District *</label>
                          <select name="district" className="form-input-control" style={{ height: '26px' }} value={formState.district} onChange={handleFormChange}>
                            <option value="">Select District</option>
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Medchal">Medchal</option>
                            <option value="Warangal">Warangal</option>
                          </select>
                          {formErrors.district && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.district}</span>}
                        </div>
                        <div className="form-field">
                          <label>Institution Type *</label>
                          <select name="institutionType" className="form-input-control" style={{ height: '26px' }} value={formState.institutionType} onChange={handleFormChange}>
                            <option value="">Select Type</option>
                            <option value="Government School">Government School</option>
                            <option value="Private School">Private School</option>
                            <option value="Govt College">Govt College</option>
                          </select>
                          {formErrors.institutionType && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.institutionType}</span>}
                        </div>
                        <div className="form-field">
                          <label>Institution Name *</label>
                          <select name="institution" className="form-input-control" style={{ height: '26px' }} value={formState.institution} onChange={handleFormChange}>
                            <option value="">Select School</option>
                            {formState.district === 'Hyderabad' ? (
                              <>
                                <option value="Govt Boys High School, Koti">Govt Boys High School, Koti</option>
                                <option value="Koti Junior College">Koti Junior College</option>
                              </>
                            ) : (
                              <option value="Model School Alpha">Model School Alpha</option>
                            )}
                          </select>
                          {formErrors.institution && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.institution}</span>}
                        </div>
                        <div className="form-field">
                          <label>Course *</label>
                          <select name="course" className="form-input-control" style={{ height: '26px' }} value={formState.course} onChange={handleFormChange}>
                            <option value="">Select Course</option>
                            <option value="Class 8">Class 8</option>
                            <option value="Class 9">Class 9</option>
                            <option value="Class 10">Class 10</option>
                            <option value="Intermediate 1st Year">Intermediate 1st Year</option>
                          </select>
                          {formErrors.course && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.course}</span>}
                        </div>
                        <div className="form-field">
                          <label>Admission / Roll No *</label>
                          <input type="text" name="rollNo" className="form-input-control" value={formState.rollNo} onChange={handleFormChange} />
                          {formErrors.rollNo && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.rollNo}</span>}
                        </div>
                      </div>
                      <div className="form-buttons">
                        <button type="button" className="login-btn-classic" onClick={handlePrevStep}>Back</button>
                        <button type="button" className="login-btn-classic" onClick={handleNextStep}>Next</button>
                      </div>
                    </div>
                  )}

                  {applyStep === 3 && (
                    <div>
                      <div className="form-section-title">Step 3: Bus Pass Details</div>
                      <div className="form-grid">
                        <div className="form-field">
                          <label>Pass Sub-Type *</label>
                          <select name="passType" className="form-input-control" style={{ height: '26px' }} value={formState.passType} onChange={handleFormChange}>
                            <option value="">Select Pass Type</option>
                            <option value="Student Free Pass">Student Free Pass</option>
                            <option value="Student Monthly Route Pass">Student Monthly Route Pass</option>
                          </select>
                          {formErrors.passType && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.passType}</span>}
                        </div>
                        <div className="form-field">
                          <label>Boarding Station *</label>
                          <input type="text" name="boarding" className="form-input-control" value={formState.boarding} onChange={handleFormChange} />
                          {formErrors.boarding && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.boarding}</span>}
                        </div>
                        <div className="form-field">
                          <label>Destination Station *</label>
                          <input type="text" name="destination" className="form-input-control" value={formState.destination} onChange={handleFormChange} />
                          {formErrors.destination && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.destination}</span>}
                        </div>
                        <div className="form-field">
                          <label>Pass Collection Counter *</label>
                          <select name="pickup" className="form-input-control" style={{ height: '26px' }} value={formState.pickup} onChange={handleFormChange}>
                            <option value="">Select Location</option>
                            <option value="Koti Bus Station Counter">Koti Bus Station Counter</option>
                            <option value="Rathifile Bus Station Secunderabad">Rathifile Bus Station Secunderabad</option>
                          </select>
                          {formErrors.pickup && <span style={{ color: 'red', fontSize: '10px' }}>{formErrors.pickup}</span>}
                        </div>
                      </div>
                      <div className="form-buttons">
                        <button type="button" className="login-btn-classic" onClick={handlePrevStep}>Back</button>
                        <button type="button" className="login-btn-classic" onClick={handleNextStep}>Next</button>
                      </div>
                    </div>
                  )}

                  {applyStep === 4 && (
                    <div>
                      <div className="form-section-title">Step 4: Declaration & Review</div>
                      <div style={{ backgroundColor: '#fafafa', padding: '10px', border: '1px solid #ddd', marginBottom: '15px', borderRadius: '3px' }}>
                        <p style={{ margin: '2px 0' }}><strong>Student Name:</strong> {formState.name}</p>
                        <p style={{ margin: '2px 0' }}><strong>Aadhaar Card:</strong> {formState.aadhaar}</p>
                        <p style={{ margin: '2px 0' }}><strong>School/College:</strong> {formState.institution}</p>
                        <p style={{ margin: '2px 0' }}><strong>Route:</strong> {formState.boarding} to {formState.destination}</p>
                      </div>
                      
                      <div className="form-field" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                        <input type="checkbox" id="agree" name="agree" checked={formState.agree} onChange={handleFormChange} />
                        <label htmlFor="agree" style={{ cursor: 'pointer' }}>I declare that all facts written above are correct. *</label>
                      </div>
                      {formErrors.agree && <p style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{formErrors.agree}</p>}

                      <div className="form-buttons">
                        <button type="button" className="login-btn-classic" onClick={handlePrevStep}>Back</button>
                        <button type="submit" className="login-btn-classic">Submit Application</button>
                      </div>
                    </div>
                  )}

                  {applyStep === 5 && receiptApp && (
                    <div className="receipt-box">
                      <div className="receipt-header">
                        <h3>✓ Student Bus Pass Receipt</h3>
                        <p>TGSRTC Concessional Pass Portal</p>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Reference ID:</span>
                        <span className="receipt-val" style={{ color: '#176bb2' }}>{receiptApp.id}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Student Name:</span>
                        <span className="receipt-val">{receiptApp.name}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Institution:</span>
                        <span className="receipt-val">{receiptApp.institution}</span>
                      </div>
                      <div className="receipt-row">
                        <span className="receipt-label">Collection Location:</span>
                        <span className="receipt-val">{receiptApp.pickup}</span>
                      </div>
                      <p style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '8px', fontSize: '10.5px', color: '#666', textAlign: 'center' }}>
                        Please save/print this receipt and visit your institution counter for status logs.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                        <button type="button" className="login-btn-classic" onClick={() => {
                          setSearchRefId(receiptApp.id);
                          setSearchedApp(receiptApp);
                          setTicketingView('track');
                        }}>Track Status</button>
                        <button type="button" className="login-btn-classic" onClick={() => setTicketingView('menu')}>Main Menu</button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {ticketingView === 'track' && (
              <div>
                <h2 className="tab-title">Track Bus Pass Application</h2>
                <form onSubmit={handleSearchSubmit} className="track-search-row">
                  <input
                    type="text"
                    placeholder="Enter Reference ID (e.g. TG-2026-8080)"
                    className="login-input"
                    style={{ flex: 1 }}
                    value={searchRefId}
                    onChange={(e) => setSearchRefId(e.target.value)}
                  />
                  <button type="submit" className="login-btn-classic">Search</button>
                </form>

                {searchError && (
                  <div className="status-msg-box status-msg-error" style={{ marginBottom: '15px' }}>
                    {searchError}
                  </div>
                )}

                {searchedApp && (
                  <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    <h3 className="sub-title">Status Details for {searchedApp.name} ({searchedApp.id})</h3>
                    <p style={{ margin: '4px 0', fontSize: '11.5px' }}><strong>Institution:</strong> {searchedApp.institution}</p>
                    <p style={{ margin: '4px 0', fontSize: '11.5px' }}><strong>Pass Type:</strong> {searchedApp.passType}</p>

                    <div className="timeline-row">
                      <div className={`timeline-item ${searchedApp.step >= 0 ? 'completed' : ''} ${searchedApp.step === 0 ? 'active' : ''}`}>
                        <div className="timeline-circle">1</div>
                        <div className="timeline-txt">Submitted</div>
                      </div>
                      <div className={`timeline-item ${searchedApp.step >= 1 ? 'completed' : ''} ${searchedApp.step === 1 ? 'active' : ''}`}>
                        <div className="timeline-circle">2</div>
                        <div className="timeline-txt">School Ok</div>
                      </div>
                      <div className={`timeline-item ${searchedApp.step >= 2 ? 'completed' : ''} ${searchedApp.step === 2 ? 'active' : ''}`}>
                        <div className="timeline-circle">3</div>
                        <div className="timeline-txt">RTC Approved</div>
                      </div>
                      <div className={`timeline-item ${searchedApp.step >= 3 ? 'completed' : ''} ${searchedApp.step === 3 ? 'active' : ''}`}>
                        <div className="timeline-circle">4</div>
                        <div className="timeline-txt">Dispatched</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', borderLeft: '3px solid #1b4786', padding: '10px', fontSize: '11.5px', marginTop: '12px' }}>
                      {searchedApp.step === 0 && 'Log: Application logged online. Institutional verification is pending.'}
                      {searchedApp.step === 1 && 'Log: Approved by School Principal. Forwarded to RTC Office.'}
                      {searchedApp.step === 2 && 'Log: Pass details verified by TGSRTC. Print queue allocated.'}
                      {searchedApp.step === 3 && `Log: Pass printed and dispatched to: "${searchedApp.pickup}". Ready for collection.`}
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '15px' }}>
                  <button type="button" className="login-btn-classic" onClick={() => setTicketingView('menu')}>Back to Menu</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer copyright section */}
      <footer>
        <div className="footer-inner">
          <div>2014 &copy; Copyright RTC. All Rights Reserved. &nbsp;&nbsp;|&nbsp;&nbsp; Last Updated on: 2-Jun-2024</div>
          <div className="footer-logo-cgg">
            <a href="https://www.cgg.gov.in" target="_blank" rel="noopener noreferrer">https://www.cgg.gov.in/</a>
            <span style={{ fontSize: '9px', padding: '2px 4px', border: '1px solid #ffb74d', backgroundColor: '#fff3e0', borderRadius: '2px', color: '#e65100', fontWeight: 'bold' }}>Designed & Developed by CGG</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

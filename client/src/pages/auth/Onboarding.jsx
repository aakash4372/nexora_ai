import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';

const STEPS = [
  { title: 'Create your workspace', icon: 'building', desc: 'Give your workspace a name. You can invite teammates and connect channels next.' },
  { title: 'Connect Facebook Page', icon: 'globe', desc: 'Link a Facebook Page so Nexora can manage Messenger conversations.' },
  { title: 'Connect Instagram', icon: 'sparkle', desc: 'Link an Instagram professional account for DMs, comments & story replies.' },
  { title: 'Grant Meta permissions', icon: 'key', desc: 'Approve the permissions Nexora needs to send & receive messages on your behalf.' },
  { title: "You're all set", icon: 'check', desc: "Your workspace is ready. Let's take you to the dashboard." },
];

const PERMISSIONS = ['Manage messages', 'Manage comments', 'Access page info', 'Manage leads'];

export default function Onboarding() {
  const { state, dispatch, showToast } = useApp();
  const step = state.onboardingStep;
  const stepData = STEPS[step - 1];

  function next() {
    if (step === 1) {
      const input = document.getElementById('ob-wsname');
      if (input?.value.trim()) dispatch({ type: 'SET_WORKSPACE', payload: { name: input.value.trim() } });
    }
    if (step < 5) {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: step + 1 });
    } else {
      dispatch({ type: 'SET_ONBOARDED', payload: true });
      showToast('Workspace ready 🎉', 'success');
    }
  }

  function back() {
    if (step > 1) dispatch({ type: 'SET_ONBOARDING_STEP', payload: step - 1 });
  }

  let body;
  if (step === 1) {
    body = (
      <>
        <div className="field">
          <label>Workspace name</label>
          <input id="ob-wsname" type="text" defaultValue={state.workspace.name} />
        </div>
        <div className="field">
          <label>Industry</label>
          <select>
            <option>E-commerce</option><option>SaaS</option><option>Agency</option><option>Other</option>
          </select>
        </div>
      </>
    );
  } else if (step === 2) {
    body = (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--glass-brd)', borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="integration-logo" style={{ background: 'rgba(24,119,242,0.15)', color: '#5B9BFF', width: 38, height: 38 }}>f</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Nexora Demo Page</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>1.2k followers</div>
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => showToast('Facebook Page connected', 'success')}>Connect</button>
        </div>
        <div className="section-note">This is a simulated connection for the prototype.</div>
      </>
    );
  } else if (step === 3) {
    body = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--glass-brd)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="integration-logo" style={{ background: 'rgba(225,48,108,0.15)', color: '#F472B6', width: 38, height: 38 }}>ig</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>@nexoralabs.demo</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>3.4k followers</div>
          </div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => showToast('Instagram account connected', 'success')}>Connect</button>
      </div>
    );
  } else if (step === 4) {
    body = (
      <>
        {PERMISSIONS.map((p) => {
          let toggled = true;
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--glass-brd)', borderRadius: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13.5 }}>{p}</span>
              <div className="switch on" onClick={(e) => e.currentTarget.classList.toggle('on')} />
            </div>
          );
        })}
      </>
    );
  } else {
    body = (
      <div className="section-note">
        Workspace <b>{state.workspace.name}</b> is ready with Instagram, Facebook & Webhook connected. You can connect WhatsApp anytime from Integrations.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 560, padding: 34 }}>
        {/* Step progress bars */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < step ? 'var(--grad)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'var(--grad-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <Icon name={stepData.icon} style={{ width: 28, height: 28, stroke: '#B9C6FF' }} />
        </div>

        <h2 style={{ fontSize: 21, marginBottom: 8 }}>{stepData.title}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 22 }}>{stepData.desc}</p>

        {body}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
          {step > 1
            ? <button className="btn" onClick={back}><Icon name="arrowLeft" /> Back</button>
            : <span />}
          <button className="btn btn-primary" onClick={next}>
            {step === 5 ? 'Go to dashboard' : 'Continue'} <Icon name="arrowRight" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function TermsOfService() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F172A',
      color: '#E2E8F0',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '40px 24px',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: 'rgba(255, 255, 255, 0.03)', padding: 40, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>Last updated: July 31, 2026</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>1. Agreement to Terms</h2>
          <p>By accessing or using Nexora Labs ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>2. Description of Service</h2>
          <p>Nexora provides social media messaging automation, customer support inbox management, and analytics tools for Instagram, Meta Messenger, and WhatsApp Business channels.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>3. Meta & Platform Compliance</h2>
          <p>Users must comply with all applicable Terms of Service and Community Guidelines set forth by Meta Platforms, Inc. and Instagram. You agree not to send spam, unsolicited commercial messages, or illegal content using our Service.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>4. User Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account credentials and for all activities occurring under your account.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>5. Limitation of Liability</h2>
          <p>In no event shall Nexora Labs be liable for indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>6. Contact Information</h2>
          <p>For any inquiries regarding these Terms of Service, please contact us at <strong>legal@nexoralabs.io</strong>.</p>
        </section>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#64748B' }}>
          &copy; 2026 Nexora Labs. All rights reserved.
        </div>
      </div>
    </div>
  );
}

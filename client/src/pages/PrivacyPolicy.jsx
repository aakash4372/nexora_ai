import React from 'react';

export default function PrivacyPolicy() {
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>Last updated: July 31, 2026</p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>1. Introduction</h2>
          <p>Nexora Labs ("we", "our", or "us") respects your privacy and is committed to protecting the personal data of our users and their Instagram audience. This Privacy Policy explains how we collect, use, store, and process information when you connect your Instagram Business account to Nexora.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>2. Information We Collect</h2>
          <p>When you integrate Instagram Business with Nexora, we collect:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Account Information:</strong> Your Instagram username, profile picture, account ID, and linked Facebook Page ID.</li>
            <li><strong>Messaging & Interactive Data:</strong> Direct Messages (DMs), post/story comment content, reaction events, and recipient usernames required to perform automated replies requested by you.</li>
            <li><strong>Access Tokens:</strong> Secure OAuth access tokens granted via Meta authorization to interact with Meta Graph APIs.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>3. How We Use Information</h2>
          <p>We strictly use the collected data to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Provide automated DM and comment reply triggers configured in your Nexora workspace.</li>
            <li>Sync conversations to your Nexora Inbox for human operator handoffs.</li>
            <li>Analyze automation performance and generate workspace analytics.</li>
          </ul>
          <p style={{ marginTop: 8 }}>We <strong>do not</strong> sell your personal data or share message content with unauthorized third parties.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>4. Data Protection & Security</h2>
          <p>All sensitive information, including Meta access tokens, is encrypted in transit using HTTPS/TLS and at rest using AES-256 encryption in our secure database infrastructure.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>5. Data Deletion & Disconnection</h2>
          <p>You can disconnect your Instagram Business Account at any time from the Integrations tab in Nexora. Disconnecting will revoke our access tokens and delete webhook subscriptions. To request complete account data deletion, email support at <strong>support@nexoralabs.io</strong>.</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, color: '#F8FAFC', marginBottom: 12 }}>6. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact us at <strong>privacy@nexoralabs.io</strong>.</p>
        </section>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: '#64748B' }}>
          &copy; 2026 Nexora Labs. All rights reserved.
        </div>
      </div>
    </div>
  );
}

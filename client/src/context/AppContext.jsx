import { createContext, useContext, useReducer, useCallback } from 'react';

/* ─── Initial State (mirrors prototype) ───────────────────── */
const initialState = {
  // Auth
  loggedIn: false,
  screen: 'login', // login | register | forgot | reset
  onboarded: false,
  onboardingStep: 1,
  activeAccount: null,

  // App
  page: 'dashboard',
  sidebarCollapsed: false,

  // User & workspace
  user: { name: 'Aarav Sharma', email: 'aarav@nexoralabs.io', initials: 'AS' },
  workspace: { name: 'Nexora Demo Co', plan: 'Pro' },

  // Data
  conversations: [
    { id: 1, name: 'Riya Kapoor', channel: 'instagram', last: 'Is the blue one still in stock?', time: '2m', unread: 2, assigned: 'AI', tags: ['Lead', 'VIP'], typing: true,
      msgs: [
        { id: 1, from: 'them', text: 'Hi! I saw your story about the new collection 👀' },
        { id: 2, from: 'ai', text: 'Hey Riya! Yes, the Spring Drop just landed. Want me to send you the lookbook?' },
        { id: 3, from: 'them', text: 'Yes please!' },
        { id: 4, from: 'them', text: 'Is the blue one still in stock?' },
      ]},
    { id: 2, name: 'Karan Mehta', channel: 'whatsapp', last: 'Thank you so much 🙏', time: '14m', unread: 0, assigned: 'Priya', tags: ['Customer'], typing: false,
      msgs: [
        { id: 1, from: 'them', text: "My order hasn't arrived yet" },
        { id: 2, from: 'out', text: "So sorry about that Karan — I've escalated it, refund issued if not delivered by Friday." },
        { id: 3, from: 'them', text: 'Thank you so much 🙏' },
      ]},
    { id: 3, name: 'Neha Verma', channel: 'facebook', last: 'Can I get a discount code?', time: '1h', unread: 1, assigned: 'Unassigned', tags: ['Lead'], typing: false,
      msgs: [{ id: 1, from: 'them', text: 'Can I get a discount code?' }]},
    { id: 4, name: 'Devansh Rao', channel: 'instagram', last: 'Perfect, booking now', time: '3h', unread: 0, assigned: 'AI', tags: [], typing: false,
      msgs: [
        { id: 1, from: 'them', text: 'Do you have size L?' },
        { id: 2, from: 'ai', text: 'Yes! Size L is available in all colors.' },
        { id: 3, from: 'them', text: 'Perfect, booking now' },
      ]},
    { id: 5, name: 'Ishita Rao', channel: 'whatsapp', last: '👍', time: '1d', unread: 0, assigned: 'AI', tags: ['Customer'], typing: false,
      msgs: [{ id: 1, from: 'them', text: '👍' }]},
  ],
  selectedConvId: 1,
  inboxFilter: 'all',

  contacts: [
    { id: 1, name: 'Riya Kapoor', channel: 'Instagram', phone: '+91 98765 43210', email: 'riya.k@gmail.com', score: 82, tags: ['Lead', 'VIP'] },
    { id: 2, name: 'Karan Mehta', channel: 'WhatsApp', phone: '+91 91234 56780', email: 'karan.m@gmail.com', score: 64, tags: ['Customer'] },
    { id: 3, name: 'Neha Verma', channel: 'Facebook', phone: '+91 99887 66554', email: 'neha.v@gmail.com', score: 41, tags: ['Lead'] },
    { id: 4, name: 'Devansh Rao', channel: 'Instagram', phone: '+91 90000 11122', email: 'devansh.r@gmail.com', score: 77, tags: [] },
  ],

  automations: [
    { id: 1, name: 'Welcome DM Flow', status: 'Live', trigger: 'New Follower', runs: 1204 },
    { id: 2, name: 'Order Status Bot', status: 'Live', trigger: 'Keyword: order', runs: 842 },
    { id: 3, name: 'Discount Comment Reply', status: 'Paused', trigger: 'Comment', runs: 301 },
  ],

  campaigns: [
    { id: 1, name: 'Spring Drop Launch', status: 'Scheduled', audience: 'All Contacts', date: 'Jul 22, 2026', sent: 0 },
    { id: 2, name: 'Abandoned Cart Nudge', status: 'Completed', audience: 'Cart Segment', date: 'Jul 10, 2026', sent: 1420 },
    { id: 3, name: 'VIP Early Access', status: 'Draft', audience: 'VIP Tag', date: '—', sent: 0 },
  ],

  team: [
    { id: 1, name: 'Aarav Sharma', email: 'aarav@nexoralabs.io', role: 'Owner' },
    { id: 2, name: 'Priya Nair', email: 'priya@nexoralabs.io', role: 'Admin' },
    { id: 3, name: 'Rohan Das', email: 'rohan@nexoralabs.io', role: 'Support' },
  ],

  integrations: [
    { id: 'instagram', name: 'Instagram', desc: 'DMs, comments & story replies', connected: true, color: '#E1306C' },
    { id: 'facebook', name: 'Facebook Messenger', desc: 'Page inbox automation', connected: true, color: '#1877F2' },
    { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Cloud API messaging', connected: true, color: '#25D366' },
    { id: 'telegram', name: 'Telegram', desc: 'Bot API integration', connected: false, color: '#2AABEE' },
    { id: 'slack', name: 'Slack', desc: 'Team alerts & handoffs', connected: false, color: '#611f69' },
    { id: 'sheets', name: 'Google Sheets', desc: 'Sync contacts & leads', connected: false, color: '#0F9D58' },
    { id: 'hubspot', name: 'HubSpot', desc: 'CRM sync', connected: false, color: '#FF7A59' },
    { id: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM sync', connected: false, color: '#00A1E0' },
    { id: 'zapier', name: 'Zapier', desc: '5000+ app automations', connected: false, color: '#FF4A00' },
    { id: 'webhook', name: 'Custom Webhook', desc: 'Send events to any URL', connected: true, color: '#5B7CFA' },
  ],

  apiKeys: [
    { id: 1, name: 'Production Key', key: 'nx_live_8f2a9c...e21b', created: 'Jun 2, 2026' },
  ],

  // Toast queue
  toasts: [],
  // Modal
  modal: null, // { content: ReactNode, wide: bool }
};

/* ─── Reducer ────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.payload };
    case 'SET_LOGGED_IN': return { ...state, loggedIn: action.payload };
    case 'SET_USER': return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_WORKSPACE': return { ...state, workspace: { ...state.workspace, ...action.payload } };
    case 'SET_ONBOARDED': return { ...state, onboarded: action.payload };
    case 'SET_ONBOARDING_STEP': return { ...state, onboardingStep: action.payload };
    case 'SET_PAGE': return { ...state, page: action.payload };
    case 'SET_ACTIVE_ACCOUNT': return { ...state, activeAccount: action.payload };
    case 'TOGGLE_SIDEBAR': return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_INBOX_FILTER': return { ...state, inboxFilter: action.payload };
    case 'SET_SELECTED_CONV': return { ...state, selectedConvId: action.payload };
    case 'SET_CONVERSATIONS': return { ...state, conversations: action.payload };

    case 'ADD_MESSAGE': {
      const convs = state.conversations.map((c) => {
        if (c.id !== action.convId) return c;
        const newMsg = action.payload; // Already formatted msg from server
        return {
          ...c,
          msgs: [...c.msgs, newMsg],
          last: newMsg.text.slice(0, 60),
          time: 'just now',
        };
      });
      return { ...state, conversations: convs };
    }

    case 'SEND_MESSAGE': {
      const convs = state.conversations.map((c) => {
        if (c.id !== action.convId) return c;
        const newMsg = { id: c.msgs.length + 1, from: 'out', text: action.text };
        return { ...c, msgs: [...c.msgs, newMsg], last: action.text.slice(0, 60), time: 'just now' };
      });
      return { ...state, conversations: convs };
    }

    case 'MARK_READ': {
      const convs = state.conversations.map((c) =>
        c.id === action.convId ? { ...c, unread: 0 } : c
      );
      return { ...state, conversations: convs };
    }

    case 'ADD_CONTACT': return { ...state, contacts: [...state.contacts, action.payload] };
    case 'DELETE_CONTACT': return { ...state, contacts: state.contacts.filter((c) => c.id !== action.id) };
    case 'UPDATE_CONTACT': return {
      ...state,
      contacts: state.contacts.map((c) => c.id === action.id ? { ...c, ...action.payload } : c),
    };

    case 'ADD_AUTOMATION': return { ...state, automations: [...state.automations, action.payload] };
    case 'DELETE_AUTOMATION': return { ...state, automations: state.automations.filter((a) => a.id !== action.id) };
    case 'TOGGLE_AUTOMATION': return {
      ...state,
      automations: state.automations.map((a) =>
        a.id === action.id ? { ...a, status: a.status === 'Live' ? 'Paused' : 'Live' } : a
      ),
    };

    case 'ADD_CAMPAIGN': return { ...state, campaigns: [...state.campaigns, action.payload] };
    case 'DELETE_CAMPAIGN': return { ...state, campaigns: state.campaigns.filter((c) => c.id !== action.id) };

    case 'TOGGLE_INTEGRATION': return {
      ...state,
      integrations: state.integrations.map((i) =>
        i.id === action.id ? { ...i, connected: !i.connected } : i
      ),
    };

    case 'ADD_TEAM_MEMBER': return { ...state, team: [...state.team, action.payload] };
    case 'REMOVE_TEAM_MEMBER': return { ...state, team: state.team.filter((m) => m.id !== action.id) };

    case 'ADD_API_KEY': return { ...state, apiKeys: [...state.apiKeys, action.payload] };
    case 'DELETE_API_KEY': return { ...state, apiKeys: state.apiKeys.filter((k) => k.id !== action.id) };

    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case 'OPEN_MODAL': return { ...state, modal: action.payload };
    case 'CLOSE_MODAL': return { ...state, modal: null };

    case 'LOGOUT': return { ...initialState };

    default: return state;
  }
}

/* ─── Context ────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* ── Action helpers ── */
  const showToast = useCallback((msg, type = 'default') => {
    const id = Date.now();
    dispatch({ type: 'ADD_TOAST', payload: { id, msg, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 2800);
  }, []);

  const openModal = useCallback((content, wide = false) => {
    dispatch({ type: 'OPEN_MODAL', payload: { content, wide } });
  }, []);

  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

  const goPage = useCallback((page) => dispatch({ type: 'SET_PAGE', payload: page }), []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexora_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const login = useCallback((userData) => {
    if (userData?.token) localStorage.setItem('nexora_token', userData.token);
    if (userData?.user) {
      dispatch({ type: 'SET_USER', payload: userData.user });
      if (userData.user.workspace) {
        dispatch({ type: 'SET_WORKSPACE', payload: { name: userData.user.workspace } });
      }
    }
    dispatch({ type: 'SET_LOGGED_IN', payload: true });
    dispatch({ type: 'SET_ONBOARDED', payload: true });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, showToast, openModal, closeModal, goPage, logout, login }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

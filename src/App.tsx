import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Mail, 
  Settings, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCcw,
  Plus,
  MoreVertical,
  LayoutDashboard,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Contact, TrialStatus, DashboardStats } from './types';

// Mock Data Generator
const generateMockContacts = (): Contact[] => {
  const names = ["Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Ethan Hunt", "Fiona Gallagher", "George Costanza", "Hannah Abbott", "Ian Wright", "Julia Roberts"];
  const statuses: TrialStatus[] = ['active', 'passive', 'expiring', 'converted', 'expired'];
  
  return Array.from({ length: 20 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const engagementScore = status === 'active' ? 70 + Math.random() * 30 : 
                           status === 'passive' ? 10 + Math.random() * 30 : 
                           status === 'expiring' ? 30 + Math.random() * 40 : 
                           status === 'converted' ? 90 + Math.random() * 10 : 5;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (Math.floor(Math.random() * 30)));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return {
      id: `c-${i}`,
      name: names[i % names.length] + (i > 9 ? ` ${i}` : ""),
      email: `${names[i % names.length].toLowerCase().replace(" ", ".")}@example.com`,
      trialStartDate: startDate.toISOString(),
      trialEndDate: endDate.toISOString(),
      status,
      engagementScore: Math.round(engagementScore),
      lastLogin: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      emailsOpened: Math.floor(Math.random() * 20),
      clicks: Math.floor(Math.random() * 10),
      potentialRevenue: 29.99 + Math.random() * 70,
    };
  });
};

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6b7280'];

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'maximizer'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cc_contacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    } else {
      const initial = generateMockContacts();
      setContacts(initial);
      localStorage.setItem('cc_contacts', JSON.stringify(initial));
    }
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const trialUsers = contacts.filter(c => ['active', 'passive', 'expiring'].includes(c.status));
    const passive = contacts.filter(c => c.status === 'passive').length;
    const converted = contacts.filter(c => c.status === 'converted').length;
    const potential = contacts
      .filter(c => ['passive', 'expiring'].includes(c.status))
      .reduce((acc, curr) => acc + curr.potentialRevenue, 0);

    return {
      totalTrialUsers: trialUsers.length,
      passiveUsers: passive,
      conversionRate: trialUsers.length > 0 ? (converted / (trialUsers.length + converted)) * 100 : 0,
      potentialRevenue: potential
    };
  }, [contacts]);

  const chartData = useMemo(() => {
    const statusCounts = contacts.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runAiAnalysis = async (contact: Contact) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this trial user for Constant Contact and suggest a conversion strategy:
        Name: ${contact.name}
        Status: ${contact.status}
        Engagement Score: ${contact.engagementScore}/100
        Emails Opened: ${contact.emailsOpened}
        Clicks: ${contact.clicks}
        Trial Ends: ${new Date(contact.trialEndDate).toLocaleDateString()}
        
        The goal is to convert them to a paid plan ($29.99/mo). 
        Provide a concise analysis and a specific discount offer (e.g. 20% off for 3 months).`,
      });
      setAiAnalysis(response.text || "Analysis failed.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Error connecting to AI service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDiscountOffer = async (contact: Contact) => {
    setIsGeneratingOffer(true);
    try {
      // Simulate discount generation
      const newContacts = contacts.map(c => {
        if (c.id === contact.id) {
          return {
            ...c,
            discountOffered: {
              code: `CONVERT_${Math.random().toString(36).substring(7).toUpperCase()}`,
              amount: 25,
              date: new Date().toISOString()
            }
          };
        }
        return c;
      });
      setContacts(newContacts);
      localStorage.setItem('cc_contacts', JSON.stringify(newContacts));
      setSelectedContact(newContacts.find(c => c.id === contact.id) || null);
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <TrendingUp className="w-8 h-8" />
            <span>CC Maximizer</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'dashboard' ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'contacts' ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Users className="w-5 h-5" />
            Contacts
          </button>
          <button 
            onClick={() => setActiveTab('maximizer')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'maximizer' ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Sparkles className="w-5 h-5" />
            Revenue Maximizer
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-1">Potential Revenue</p>
            <p className="text-2xl font-bold">${stats.potentialRevenue.toFixed(2)}</p>
            <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-2/3"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Trial Users" 
                    value={stats.totalTrialUsers} 
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    trend="+12% from last week"
                    color="blue"
                  />
                  <StatCard 
                    title="Passive Trials" 
                    value={stats.passiveUsers} 
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    trend="Requires attention"
                    color="amber"
                  />
                  <StatCard 
                    title="Conversion Rate" 
                    value={`${stats.conversionRate.toFixed(1)}%`} 
                    icon={<Percent className="w-6 h-6 text-emerald-600" />}
                    trend="+2.4% this month"
                    color="emerald"
                  />
                  <StatCard 
                    title="Potential Revenue" 
                    value={`$${stats.potentialRevenue.toFixed(0)}`} 
                    icon={<DollarSign className="w-6 h-6 text-indigo-600" />}
                    trend="Available to capture"
                    color="indigo"
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Engagement Trends</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={contacts.slice(0, 7).map((c, i) => ({ day: `Day ${i+1}`, score: c.engagementScore }))}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Trial Status Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {chartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="capitalize text-slate-600">{entry.name}</span>
                          </div>
                          <span className="font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contacts' && (
              <motion.div 
                key="contacts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">All Contacts</h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      Add Contact
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">Contact</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Engagement</th>
                        <th className="px-6 py-4 font-medium">Trial Ends</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredContacts.map((contact) => (
                        <tr 
                          key={contact.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {contact.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{contact.name}</p>
                                <p className="text-sm text-slate-500">{contact.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={contact.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                <div 
                                  className={cn(
                                    "h-full rounded-full",
                                    contact.engagementScore > 70 ? "bg-emerald-500" :
                                    contact.engagementScore > 30 ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${contact.engagementScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-600">{contact.engagementScore}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(contact.trialEndDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'maximizer' && (
              <motion.div 
                key="maximizer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                      <Sparkles className="w-8 h-8 text-blue-200" />
                      AI Revenue Maximizer
                    </h2>
                    <p className="text-blue-100 max-w-2xl text-lg">
                      Our AI has identified <span className="font-bold text-white">{stats.passiveUsers} passive trial users</span> who are at risk of churning. 
                      Generate personalized discount offers to convert them now.
                    </p>
                    <div className="mt-8 flex gap-4">
                      <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                        Analyze All Passive Users
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <button className="bg-blue-500/30 border border-blue-400/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-500/40 transition-colors">
                        View Conversion History
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="font-semibold">High-Priority Targets</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {contacts.filter(c => c.status === 'passive').slice(0, 5).map(contact => (
                        <div 
                          key={contact.id} 
                          className={cn(
                            "p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                            selectedContact?.id === contact.id ? "bg-blue-50/50 border-l-4 border-blue-600" : ""
                          )}
                          onClick={() => setSelectedContact(contact)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{contact.name}</p>
                              <p className="text-sm text-slate-500">Score: {contact.engagementScore}% • Ends in 4 days</p>
                            </div>
                          </div>
                          <button className="text-blue-600 font-semibold text-sm hover:underline">
                            Analyze
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    {selectedContact ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold">{selectedContact.name}</h3>
                            <p className="text-slate-500">{selectedContact.email}</p>
                          </div>
                          <StatusBadge status={selectedContact.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Engagement</p>
                            <p className="text-xl font-bold text-slate-900">{selectedContact.engagementScore}%</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Potential</p>
                            <p className="text-xl font-bold text-slate-900">${selectedContact.potentialRevenue.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button 
                            onClick={() => runAiAnalysis(selectedContact)}
                            disabled={isAnalyzing}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                              <RefreshCcw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Zap className="w-5 h-5 text-yellow-400" />
                            )}
                            {isAnalyzing ? "AI is thinking..." : "Generate AI Conversion Strategy"}
                          </button>

                          {aiAnalysis && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-50 p-6 rounded-2xl border border-blue-100"
                            >
                              <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                                <Sparkles className="w-4 h-4" />
                                AI Recommendation
                              </div>
                              <div className="prose prose-sm text-slate-700 max-w-none">
                                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                              </div>
                              {!selectedContact.discountOffered && (
                                <button 
                                  onClick={() => generateDiscountOffer(selectedContact)}
                                  className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                  Apply Recommended Discount
                                </button>
                              )}
                            </motion.div>
                          )}

                          {selectedContact.discountOffered && (
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                                <CheckCircle2 className="w-4 h-4" />
                                Discount Applied
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-slate-600">Promo Code</p>
                                  <p className="text-xl font-mono font-bold text-emerald-700">{selectedContact.discountOffered.code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600">Amount</p>
                                  <p className="text-xl font-bold text-emerald-700">{selectedContact.discountOffered.amount}% OFF</p>
                                </div>
                              </div>
                              <button className="mt-4 w-full border border-emerald-200 text-emerald-700 py-3 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
                                <Mail className="w-5 h-5" />
                                Send Offer Email
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <Users className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">No Contact Selected</h4>
                          <p className="text-slate-500 max-w-xs">Select a passive trial user from the list to generate a conversion strategy.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Contact Detail Modal (Overlay) */}
      <AnimatePresence>
        {selectedContact && activeTab === 'contacts' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedContact(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                      {selectedContact.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedContact.name}</h2>
                      <p className="text-slate-500">{selectedContact.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedContact(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <RefreshCcw className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
                    <StatusBadge status={selectedContact.status} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold">Trial Ends</p>
                    <p className="font-semibold">{new Date(selectedContact.trialEndDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold">Engagement</p>
                    <p className="font-semibold text-blue-600">{selectedContact.engagementScore}%</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6">
                  <h4 className="font-bold mb-4">Activity Summary</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Emails Opened</p>
                        <p className="font-bold">{selectedContact.emailsOpened}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Clicks</p>
                        <p className="font-bold">{selectedContact.clicks}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
                    Edit Contact
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('maximizer');
                      setSelectedContact(selectedContact);
                    }}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Maximize Revenue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", {
          "bg-blue-50": color === 'blue',
          "bg-amber-50": color === 'amber',
          "bg-emerald-50": color === 'emerald',
          "bg-indigo-50": color === 'indigo',
        })}>
          {icon}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-3xl font-bold text-slate-900 mt-1">{value}</h4>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        {trend.includes('+') ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
        {trend}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: TrialStatus }) {
  const styles = {
    active: "bg-blue-100 text-blue-700",
    passive: "bg-amber-100 text-amber-700",
    expiring: "bg-red-100 text-red-700",
    converted: "bg-emerald-100 text-emerald-700",
    expired: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", styles[status])}>
      {status}
    </span>
  );
}

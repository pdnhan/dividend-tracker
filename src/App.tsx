import { useState } from 'react';
import { PortfolioProvider, CurrencyProvider } from './context/PortfolioContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PortfolioTable from './components/PortfolioTable';
import AddEditModal from './components/AddEditModal';
import ImportModal from './components/ImportModal';
import { ProjectionSimulator } from './components/ProjectionSimulator';

type AppTab = 'portfolio' | 'simulator';

function AppContent() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('portfolio');

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header
        onImportClick={() => setIsImportModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab navigation */}
        <div className="app-tabs" role="tablist" aria-label="Main navigation">
          <button
            role="tab"
            aria-selected={activeTab === 'portfolio'}
            className={`app-tab${activeTab === 'portfolio' ? ' active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'simulator'}
            className={`app-tab${activeTab === 'simulator' ? ' active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            Simulator
          </button>
        </div>

        {activeTab === 'portfolio' && (
          <>
            <Dashboard />
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Your Portfolio
                </h2>
              </div>
              <PortfolioTable />
            </div>
          </>
        )}

        {activeTab === 'simulator' && <ProjectionSimulator />}
      </main>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
    </CurrencyProvider>
  );
}

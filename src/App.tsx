import { useState } from 'react';
import { PortfolioProvider, CurrencyProvider } from './context/PortfolioContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PortfolioTable from './components/PortfolioTable';
import AddEditModal from './components/AddEditModal';
import ImportModal from './components/ImportModal';

function AppContent() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-radial">
      <Header 
        onImportClick={() => setIsImportModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Your Portfolio
            </h2>
          </div>
          <PortfolioTable />
        </div>
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

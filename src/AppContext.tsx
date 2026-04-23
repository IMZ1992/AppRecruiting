import React, { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Candidate, Offer, Application } from './types';

interface AppContextType {
  allCandidates: Candidate[];
  updateCandidate: (id: string, data: Partial<Candidate>) => void;
  customFields: string[];
  addCustomField: (field: string) => void;
  applications: Application[];
  offers: Offer[];
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, data: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  addApplication: (application: Application) => void;
  updateApplicationStatus: (id: string, status: string, decidedBy?: string) => void;
  addDrivenValueCandidates: (candidates: Candidate[]) => void;
  deleteDrivenValueCandidate: (id: string) => void;
  isRefreshing: boolean;
  fetchData: (force?: boolean) => void;
  lastUpdated: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('ntt_candidates');
    return saved ? JSON.parse(saved) : [];
  });
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem('ntt_applications');
    return saved ? JSON.parse(saved) : [];
  });
  const [offers, setOffers] = useState<Offer[]>(() => {
    const saved = localStorage.getItem('ntt_offers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('ntt_candidates', JSON.stringify(allCandidates));
  }, [allCandidates]);

  useEffect(() => {
    localStorage.setItem('ntt_offers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem('ntt_applications', JSON.stringify(applications));
  }, [applications]);

  const fetchData = async (force = false) => {
    setIsRefreshing(true);
    try {
      // Trigger the webhook
      fetch('https://imantero2.app.n8n.cloud/webhook-test/a939d9e3-af3f-451c-a01f-bd957343ac9a', {
        method: 'POST',
        mode: 'no-cors'
      }).catch(console.error);

      // Fetch Google Sheet data
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1O8NQ73nN_YTttpiCH_0u9dFQEucGzjZLOhbQ9yF5pmg/export?format=csv';
      const response = await fetch(sheetUrl);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedCandidates: Candidate[] = results.data.map((row: any, index) => ({
            id: `sheet-${index}`,
            source: 'direct',
            Nombre: row['Nombre'] || row['Name'] || row['Candidato'] || '',
            Perfil: row['Perfil'] || row['Profile'] || '',
            Localización: row['Localización'] || row['Location'] || '',
            'Key Knowledge': row['Key Knowledge'] || row['Conocimientos'] || '',
            status: row['Status'] || row['Estado'] || 'Nuevo',
            ...row
          }));
          
          setAllCandidates(prev => {
            const drivenValue = prev.filter(c => c.isDrivenValue);
            return [...parsedCandidates, ...drivenValue];
          });
          
          setLastUpdated(new Date());
          setIsRefreshing(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setIsRefreshing(false);
        }
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up 15 minute interval
    const intervalId = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const updateCandidate = (id: string, data: Partial<Candidate>) => {
    setAllCandidates(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addCustomField = (field: string) => {
    if (!customFields.includes(field)) {
      setCustomFields([...customFields, field]);
    }
  };

  const addOffer = (offer: Offer) => {
    setOffers([...offers, offer]);
  };

  const updateOffer = (id: string, data: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const addApplication = (application: Application) => {
    setApplications([...applications, application]);
  };

  const updateApplicationStatus = (id: string, status: string, decidedBy?: string) => {
    setApplications(prev => {
      const app = prev.find(a => a.id === id);
      if (app && decidedBy) {
        setAllCandidates(prevCands => 
          prevCands.map(c => c.id === app.candidateId ? { ...c, responsable: decidedBy } : c)
        );
      }
      return prev.map(a => a.id === id ? { ...a, status, decidedBy } : a);
    });
  };

  const addDrivenValueCandidates = (candidates: Candidate[]) => {
    setAllCandidates([...allCandidates, ...candidates]);
  };

  const deleteDrivenValueCandidate = (id: string) => {
    setAllCandidates(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      allCandidates,
      updateCandidate,
      customFields,
      addCustomField,
      applications,
      offers,
      addOffer,
      updateOffer,
      deleteOffer,
      addApplication,
      updateApplicationStatus,
      addDrivenValueCandidates,
      deleteDrivenValueCandidate,
      isRefreshing,
      fetchData,
      lastUpdated
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

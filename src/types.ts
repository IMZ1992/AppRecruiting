export interface Candidate {
  id: string;
  source: 'direct' | 'driven-value';
  isDrivenValue?: boolean;
  drivenValueStatus?: 'Staffing' | 'Proyecto';
  Nombre?: string;
  Perfil?: string;
  Localización?: string;
  'Key Knowledge'?: string;
  status?: string;
  step?: string;
  rating?: number;
  comments?: string;
  customFields?: Record<string, string>;
  Cliente?: string;
  Candidatura?: string;
  interviewStatus?: string;
  'Fecha Solicitud'?: string;
  [key: string]: any;
}

export interface Offer {
  id: string;
  title: string;
  status: 'Abierta' | 'Cerrada' | 'En Pausa';
  client?: string;
  projectCode?: string;
  description?: string;
  requirements?: string;
  linkedCandidates?: string[];
  [key: string]: any;
}

export interface Application {
  id: string;
  candidateId: string;
  offerId: string;
  status: string;
  date: string;
}

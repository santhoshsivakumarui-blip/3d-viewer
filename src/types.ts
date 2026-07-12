export type VisualStyle = 'realistic' | 'conceptual' | 'wireframe' | 'xray' | 'hiddenLine';
export type NavMode = 'orbit' | 'walkthrough';

export interface BimElement {
  id: string; // e.g., "#120"
  type: string; // e.g., "IfcWall", "IfcWindow", "IfcSlab", "IfcDoor", "IfcColumn", "IfcBeam", etc.
  name: string;
  visible: boolean;
  properties: {
    GlobalId?: string;
    Name?: string;
    Description?: string;
    ObjectType?: string;
    Material?: string;
    FireRating?: string;
    LoadBearing?: string;
    Volume?: string;
    Area?: string;
    Height?: string;
    Storey?: string;
    [key: string]: string | number | undefined;
  };
  children?: BimElement[];
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  elementsCount: number;
}

export interface Measurement {
  id: string;
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  distance: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Clash {
  id: string;
  elementId1: string;
  elementName1: string;
  elementId2: string;
  elementName2: string;
  coordinates: { x: number; y: number; z: number };
  volume: number;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  resolved: boolean;
  aiResolution?: string;
  offsetTranslation?: { x: number; y: number; z: number };
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getDiagnostics: () => Promise<{
        platform: string;
        arch: string;
        version: string;
        chromeVersion: string;
        nodeVersion: string;
        electronVersion: string;
        memoryUsage: { rss: number; heapTotal: number; heapUsed: number; external: number };
        cpuUsage: { user: number; system: number };
      }>;
      openExternalLink: (url: string) => void;
    };
  }
}


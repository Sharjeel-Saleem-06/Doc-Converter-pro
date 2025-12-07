import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { SupportedFormat } from '@/lib/conversionService';

export interface ConversionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
  originalFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  convertedFiles?: {
    format: string;
    data: Blob;
    name: string;
  }[];
}

export interface ConvertedFile {
  id: string;
  originalName: string;
  convertedName: string;
  originalFormat: SupportedFormat;
  convertedFormat: SupportedFormat;
  size: number;
  blob: Blob;
  timestamp: Date;
  metadata?: {
    originalSize: number;
    convertedSize: number;
    processingTime: number;
    format: SupportedFormat;
  };
}

export interface ConversionHistory {
  id: string;
  timestamp: Date;
  inputFiles: string[];
  outputFormat: string;
  success: boolean;
  error?: string;
}

interface ConversionState {
  files: ConversionFile[];
  convertedFiles: ConvertedFile[];
  history: ConversionHistory[];
  isProcessing: boolean;
  settings: {
    defaultOutputFormat: string;
    qualitySettings: {
      pdfQuality: 'low' | 'medium' | 'high';
      imageResolution: number;
    };
    batchSettings: {
      autoProcess: boolean;
      maxFiles: number;
    };
  };
}

type ConversionAction =
  | { type: 'ADD_FILES'; payload: ConversionFile[]; }
  | { type: 'REMOVE_FILE'; payload: string; }
  | { type: 'UPDATE_FILE_STATUS'; payload: { id: string; status: ConversionFile['status']; error?: string; }; }
  | { type: 'ADD_CONVERTED_FILE'; payload: ConvertedFile; }
  | { type: 'REMOVE_CONVERTED_FILE'; payload: string; }
  | { type: 'CLEAR_CONVERTED_FILES'; }
  | { type: 'SET_PROCESSING'; payload: boolean; }
  | { type: 'ADD_HISTORY'; payload: ConversionHistory; }
  | { type: 'CLEAR_HISTORY'; }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ConversionState['settings']>; }
  | { type: 'CLEAR_FILES'; };

const initialState: ConversionState = {
  files: [],
  convertedFiles: [],
  history: [],
  isProcessing: false,
  settings: {
    defaultOutputFormat: 'pdf',
    qualitySettings: {
      pdfQuality: 'medium',
      imageResolution: 300
    },
    batchSettings: {
      autoProcess: false,
      maxFiles: 10
    }
  }
};

function conversionReducer(state: ConversionState, action: ConversionAction): ConversionState {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        files: [...state.files, ...action.payload]
      };

    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.payload)
      };

    case 'UPDATE_FILE_STATUS':
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.payload.id
            ? { ...file, status: action.payload.status, error: action.payload.error }
            : file
        )
      };

    case 'ADD_CONVERTED_FILE':
      return {
        ...state,
        convertedFiles: [...state.convertedFiles, action.payload]
      };

    case 'REMOVE_CONVERTED_FILE':
      return {
        ...state,
        convertedFiles: state.convertedFiles.filter((file) => file.id !== action.payload)
      };

    case 'CLEAR_CONVERTED_FILES':
      return {
        ...state,
        convertedFiles: []
      };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };

    case 'ADD_HISTORY':
      return {
        ...state,
        history: [action.payload, ...state.history]
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: []
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case 'CLEAR_FILES':
      return {
        ...state,
        files: []
      };

    default:
      return state;
  }
}

interface ConversionContextType {
  state: ConversionState;
  addFiles: (files: ConversionFile[]) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (id: string, status: ConversionFile['status'], error?: string) => void;
  addConvertedFile: (file: ConvertedFile) => void;
  removeConvertedFile: (id: string) => void;
  clearConvertedFiles: () => void;
  setProcessing: (processing: boolean) => void;
  addHistory: (history: ConversionHistory) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<ConversionState['settings']>) => void;
  clearFiles: () => void;
}

const ConversionContext = createContext<ConversionContextType | undefined>(undefined);

export function ConversionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversionReducer, initialState);

  const contextValue: ConversionContextType = {
    state,
    addFiles: (files) => dispatch({ type: 'ADD_FILES', payload: files }),
    removeFile: (id) => dispatch({ type: 'REMOVE_FILE', payload: id }),
    updateFileStatus: (id, status, error) =>
    dispatch({ type: 'UPDATE_FILE_STATUS', payload: { id, status, error } }),
    addConvertedFile: (file) =>
      dispatch({ type: 'ADD_CONVERTED_FILE', payload: file }),
    removeConvertedFile: (id) => dispatch({ type: 'REMOVE_CONVERTED_FILE', payload: id }),
    clearConvertedFiles: () => dispatch({ type: 'CLEAR_CONVERTED_FILES' }),
    setProcessing: (processing) => dispatch({ type: 'SET_PROCESSING', payload: processing }),
    addHistory: (history) => dispatch({ type: 'ADD_HISTORY', payload: history }),
    clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    clearFiles: () => dispatch({ type: 'CLEAR_FILES' })
  };

  return (
    <ConversionContext.Provider value={contextValue}>
      {children}
    </ConversionContext.Provider>
  );
}

export function useConversion() {
  const context = useContext(ConversionContext);
  if (context === undefined) {
    throw new Error('useConversion must be used within a ConversionProvider');
  }
  return context;
}
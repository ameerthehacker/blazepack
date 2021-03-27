import http from 'http';

type StartDevServerOptions = {
  directory: string;
  port?: number;
  openInBrowser?: boolean;
  onSuccess?: (server: http.Server) => void;
  onError?: (err: Error) => void;
};

type CreateProjectOptions = {
  projectName: string;
  templateId: string;
  startServer?: boolean;
  port?: number;
  onSuccess?: () => void;
  onError?: () => void;
};

type ExportSandboxOptions = {
  directory: string;
  openInBrowser?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
};

type Blazepack = {
  commands: {
    startDevServer: (options: StartDevServerOptions) => void;
    createProject: (options: CreateProjectOptions) => void;
    exportSandbox: (options: ExportSandboxOptions) => void;
  };
  utils: {
    detectTemplate: (directory: string) => string;
  };
  constants: {
    TEMPLATES: Record<string, string>;
  };
};

export default Blazepack;

type EnvironmentVariables = {
  DATABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  ALLOW_DEV_AUTH_BYPASS?: string;
  PORT?: string;
};

export const validateEnv = (config: EnvironmentVariables) => {
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL es obligatorio para iniciar la API.');
  }

  return {
    ...config,
    ALLOW_DEV_AUTH_BYPASS: config.ALLOW_DEV_AUTH_BYPASS ?? 'false',
    PORT: config.PORT ?? '4000',
  };
};

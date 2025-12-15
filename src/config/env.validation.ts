/**
 * Environment Variable Validation
 * Validates required and optional environment variables
 */

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVariable {
  key: string;
  required: boolean;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate environment variable value
 */
function isValidEnvValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Environment variable definitions for production mode
 */
const PRODUCTION_ENV_VARS: EnvVariable[] = [
  // App Configuration - Required for production
  {
    key: 'EXPO_PUBLIC_APP_ENV',
    required: true,
    validate: (value: string) => ['development', 'staging', 'production'].includes(value),
    errorMessage: 'Must be one of: development, staging, production',
  },

  // RPC Providers - Recommended for production (warnings only)
  {
    key: 'EXPO_PUBLIC_ETHEREUM_RPC_URL',
    required: false,
    validate: isValidUrl,
    errorMessage: 'Must be a valid HTTP(S) URL',
  },
  {
    key: 'EXPO_PUBLIC_SEPOLIA_RPC_URL',
    required: false,
    validate: isValidUrl,
    errorMessage: 'Must be a valid HTTP(S) URL',
  },
  {
    key: 'EXPO_PUBLIC_POLYGON_RPC_URL',
    required: false,
    validate: isValidUrl,
    errorMessage: 'Must be a valid HTTP(S) URL',
  },
  {
    key: 'EXPO_PUBLIC_MUMBAI_RPC_URL',
    required: false,
    validate: isValidUrl,
    errorMessage: 'Must be a valid HTTP(S) URL',
  },

  // Network Configuration
  {
    key: 'EXPO_PUBLIC_DEFAULT_NETWORK',
    required: false,
    validate: (value: string) => ['ethereum', 'sepolia', 'polygon', 'mumbai'].includes(value),
    errorMessage: 'Must be one of: ethereum, sepolia, polygon, mumbai',
  },
];

/**
 * Environment variable definitions for all modes
 */
const COMMON_ENV_VARS: EnvVariable[] = [
  // Demo Mode
  {
    key: 'EXPO_PUBLIC_DEMO_MODE',
    required: false,
    validate: (value: string) => ['true', 'false'].includes(value),
    errorMessage: 'Must be "true" or "false"',
  },

  // Log Level
  {
    key: 'EXPO_PUBLIC_LOG_LEVEL',
    required: false,
    validate: (value: string) => ['debug', 'info', 'warn', 'error'].includes(value),
    errorMessage: 'Must be one of: debug, info, warn, error',
  },
];

/**
 * Validate a single environment variable
 */
function validateEnvVar(envVar: EnvVariable): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  const value = process.env[envVar.key];

  // Check if value exists
  if (!isValidEnvValue(value)) {
    if (envVar.required) {
      return {
        valid: false,
        error: `Required environment variable ${envVar.key} is not set`,
      };
    }
    return {
      valid: true,
      warning: `Optional environment variable ${envVar.key} is not set`,
    };
  }

  // Validate value format if validator provided
  if (envVar.validate && !envVar.validate(value!)) {
    const message = `Invalid value for ${envVar.key}: ${envVar.errorMessage || 'Invalid format'}`;
    if (envVar.required) {
      return { valid: false, error: message };
    }
    return { valid: true, warning: message };
  }

  return { valid: true };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if we're in demo mode
  const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';

  // Validate common variables for all modes
  COMMON_ENV_VARS.forEach(envVar => {
    const result = validateEnvVar(envVar);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
    if (result.warning) {
      warnings.push(result.warning);
    }
  });

  // Validate production variables if not in demo mode
  if (!demoMode && appEnv === 'production') {
    warnings.push(
      'Running in production mode without demo mode. Ensure RPC providers are configured.'
    );

    PRODUCTION_ENV_VARS.forEach(envVar => {
      const result = validateEnvVar(envVar);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    });
  }

  // Validate RPC URLs if not in demo mode
  if (!demoMode) {
    const rpcVars = [
      'EXPO_PUBLIC_ETHEREUM_RPC_URL',
      'EXPO_PUBLIC_SEPOLIA_RPC_URL',
      'EXPO_PUBLIC_POLYGON_RPC_URL',
      'EXPO_PUBLIC_MUMBAI_RPC_URL',
    ];

    const hasAnyRpc = rpcVars.some(key => isValidEnvValue(process.env[key]));

    if (!hasAnyRpc) {
      warnings.push(
        'No RPC provider URLs configured. The app will use default public RPC endpoints, which may be rate-limited.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('Environment validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Throw error if validation failed
  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...result.errors.map(error => `  - ${error}`),
    ].join('\n');

    throw new EnvValidationError(errorMessage);
  }
}

/**
 * Get environment summary for debugging
 */
export function getEnvironmentSummary(): {
  demoMode: boolean;
  appEnv: string;
  hasRpcProviders: boolean;
  configuredNetworks: string[];
} {
  const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'development';

  const rpcProviders = {
    ethereum: process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL,
    sepolia: process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL,
    polygon: process.env.EXPO_PUBLIC_POLYGON_RPC_URL,
    mumbai: process.env.EXPO_PUBLIC_MUMBAI_RPC_URL,
  };

  const configuredNetworks = Object.entries(rpcProviders)
    .filter(([_, url]) => isValidEnvValue(url))
    .map(([network]) => network);

  return {
    demoMode,
    appEnv,
    hasRpcProviders: configuredNetworks.length > 0,
    configuredNetworks,
  };
}

export default {
  validateEnvironment,
  validateEnvironmentOrThrow,
  getEnvironmentSummary,
};

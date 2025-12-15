/**
 * ErrorBoundary Component
 * Catches JavaScript errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils';
import { getErrorReporter } from '../services/error/ErrorReporter';
import { ErrorSeverity, ErrorCategory } from '../types/error';
import AppConfig from '../config/app.config';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReporter = getErrorReporter();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error to legacy logger
    logger.errorWithContext('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Report to ErrorReporter service
    this.errorReporter.report(error, ErrorSeverity.HIGH, ErrorCategory.UI, {
      component: errorInfo.componentStack || undefined,
      errorBoundary: true,
    });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.emoji}>😵</Text>
              <Text style={styles.title}>Oops! Something went wrong</Text>
              <Text testID="error-message" style={styles.message}>
                We're sorry for the inconvenience. The error has been reported and we'll fix it
                soon.
              </Text>

              {(AppConfig.demoMode || __DEV__) && error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details:</Text>
                  <Text style={styles.errorMessage}>{error.message}</Text>
                  {error.stack && (
                    <Text style={styles.errorStack} numberOfLines={10}>
                      {error.stack}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                testID="retry-button"
                style={styles.button}
                onPress={this.handleRetry}
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorDetails: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 24,
    padding: 16,
    width: '100%',
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorStack: {
    color: '#666666',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  errorTitle: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#666666',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ErrorBoundary;

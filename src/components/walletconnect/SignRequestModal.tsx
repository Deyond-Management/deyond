/**
 * SignRequestModal
 * Enhanced message signing modal with risk assessment
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ethers } from 'ethers';
import i18n from '../../i18n';

export interface RiskIndicator {
  level: 'low' | 'medium' | 'high';
  reasons: string[];
}

interface SignRequestModalProps {
  visible: boolean;
  message: string | null;
  isTypedData: boolean;
  dappName: string;
  dappIcon?: string;
  onApprove: () => void;
  onReject: () => void;
}

// Known phishing patterns
const PHISHING_PATTERNS = [/seaport/i, /permit/i, /approval/i, /setapprovalforall/i];

// Common legitimate typed data domains
const KNOWN_SAFE_DOMAINS = ['Uniswap', 'OpenSea', 'Aave', 'Compound', '1inch'];

export const SignRequestModal: React.FC<SignRequestModalProps> = ({
  visible,
  message,
  isTypedData,
  dappName,
  dappIcon,
  onApprove,
  onReject,
}) => {
  const { theme } = useTheme();

  // Parse and format message
  const formattedContent = useMemo(() => {
    if (!message) return null;

    if (isTypedData) {
      try {
        const parsed = typeof message === 'string' ? JSON.parse(message) : message;
        return {
          type: 'typedData',
          domain: parsed.domain,
          primaryType: parsed.primaryType,
          message: parsed.message,
          raw: JSON.stringify(parsed, null, 2),
        };
      } catch {
        return { type: 'raw', content: message };
      }
    }

    // Check if message is hex encoded
    if (message.startsWith('0x')) {
      try {
        const decoded = ethers.toUtf8String(message);
        return { type: 'hex', decoded, raw: message };
      } catch {
        return { type: 'hex', raw: message };
      }
    }

    return { type: 'text', content: message };
  }, [message, isTypedData]);

  // Assess risk level
  const riskIndicator = useMemo((): RiskIndicator => {
    const reasons: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    if (!message) return { level, reasons };

    // Check for typed data risks
    if (isTypedData && formattedContent?.type === 'typedData') {
      const { domain, primaryType, message: typedMessage } = formattedContent as any;

      // Check if domain is known
      if (
        domain?.name &&
        !KNOWN_SAFE_DOMAINS.some(d => domain.name.toLowerCase().includes(d.toLowerCase()))
      ) {
        reasons.push(i18n.t('walletConnectRequest.riskReasons.unknownDomain'));
        level = 'medium';
      }

      // Check for permit signatures (can grant token approvals)
      if (primaryType?.toLowerCase().includes('permit')) {
        reasons.push(i18n.t('walletConnectRequest.riskReasons.permitSignature'));
        level = 'high';
      }

      // Check for SetApprovalForAll
      if (JSON.stringify(typedMessage).toLowerCase().includes('setapprovalforall')) {
        reasons.push(i18n.t('walletConnectRequest.riskReasons.nftApproval'));
        level = 'high';
      }
    }

    // Check for phishing patterns in message
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    for (const pattern of PHISHING_PATTERNS) {
      if (pattern.test(messageStr)) {
        reasons.push(i18n.t('walletConnectRequest.riskReasons.suspiciousPattern'));
        if (level !== 'high') level = 'medium';
        break;
      }
    }

    // Check message length (unusually long messages might be suspicious)
    if (messageStr.length > 5000) {
      reasons.push(i18n.t('walletConnectRequest.riskReasons.longMessage'));
      if (level === 'low') level = 'medium';
    }

    return { level, reasons };
  }, [message, isTypedData, formattedContent]);

  if (!message) return null;

  const getRiskColor = (level: RiskIndicator['level']) => {
    switch (level) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return '#F0AD4E';
      case 'low':
      default:
        return theme.colors.success;
    }
  };

  const getRiskLabel = (level: RiskIndicator['level']) => {
    switch (level) {
      case 'high':
        return i18n.t('walletConnectRequest.riskLevel.high');
      case 'medium':
        return i18n.t('walletConnectRequest.riskLevel.medium');
      case 'low':
      default:
        return i18n.t('walletConnectRequest.riskLevel.low');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {isTypedData
                  ? i18n.t('walletConnectRequest.signTypedData')
                  : i18n.t('walletConnectRequest.signMessage')}
              </Text>
              <Text style={[styles.dappName, { color: theme.colors.text.secondary }]}>
                {dappName}
              </Text>
            </View>

            {/* Risk Assessment */}
            <View
              style={[styles.riskContainer, { borderColor: getRiskColor(riskIndicator.level) }]}
            >
              <View style={styles.riskHeader}>
                <View
                  style={[styles.riskBadge, { backgroundColor: getRiskColor(riskIndicator.level) }]}
                >
                  <Text style={styles.riskBadgeText}>{getRiskLabel(riskIndicator.level)}</Text>
                </View>
                <Text style={[styles.riskTitle, { color: theme.colors.text.primary }]}>
                  {i18n.t('walletConnectRequest.riskAssessment')}
                </Text>
              </View>
              {riskIndicator.reasons.length > 0 ? (
                <View style={styles.riskReasons}>
                  {riskIndicator.reasons.map((reason, index) => (
                    <Text
                      key={index}
                      style={[styles.riskReason, { color: theme.colors.text.secondary }]}
                    >
                      {reason}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={[styles.riskReason, { color: theme.colors.text.secondary }]}>
                  {i18n.t('walletConnectRequest.noRisksDetected')}
                </Text>
              )}
            </View>

            {/* Message Content */}
            <View style={[styles.messageContainer, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {i18n.t('walletConnectRequest.messageContent')}
              </Text>

              {formattedContent?.type === 'typedData' && formattedContent.domain && (
                <View style={styles.domainInfo}>
                  <Text style={[styles.domainLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.domain')}
                  </Text>
                  <Text style={[styles.domainValue, { color: theme.colors.text.primary }]}>
                    {(formattedContent as any).domain.name || 'Unknown'}
                  </Text>
                </View>
              )}

              {formattedContent?.type === 'typedData' && (formattedContent as any).primaryType && (
                <View style={styles.domainInfo}>
                  <Text style={[styles.domainLabel, { color: theme.colors.text.secondary }]}>
                    {i18n.t('walletConnectRequest.primaryType')}
                  </Text>
                  <Text style={[styles.domainValue, { color: theme.colors.text.primary }]}>
                    {(formattedContent as any).primaryType}
                  </Text>
                </View>
              )}

              <ScrollView
                style={styles.messageScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                  {formattedContent?.type === 'hex' && (formattedContent as any).decoded
                    ? (formattedContent as any).decoded
                    : formattedContent?.type === 'typedData'
                      ? JSON.stringify((formattedContent as any).message, null, 2)
                      : (formattedContent as any)?.content || message}
                </Text>
              </ScrollView>
            </View>

            {/* Warning for high risk */}
            {riskIndicator.level === 'high' && (
              <View style={[styles.warningBanner, { backgroundColor: theme.colors.error + '20' }]}>
                <Text style={[styles.warningText, { color: theme.colors.error }]}>
                  {i18n.t('walletConnectRequest.highRiskWarning')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.rejectButton, { borderColor: theme.colors.error }]}
              onPress={onReject}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('common.cancel')}
            >
              <Text style={[styles.rejectButtonText, { color: theme.colors.error }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.approveButton,
                {
                  backgroundColor:
                    riskIndicator.level === 'high' ? theme.colors.error : theme.colors.primary,
                },
              ]}
              onPress={onApprove}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('walletConnectRequest.sign')}
            >
              <Text style={styles.approveButtonText}>{i18n.t('walletConnectRequest.sign')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  approveButton: {
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    marginTop: 100,
  },
  content: {
    padding: 24,
  },
  dappName: {
    fontSize: 14,
    marginTop: 4,
  },
  domainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  domainLabel: {
    fontSize: 14,
  },
  domainValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  messageContainer: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  messageScroll: {
    maxHeight: 200,
  },
  messageText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  rejectButton: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  riskBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  riskContainer: {
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  riskHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  riskReason: {
    fontSize: 13,
    marginTop: 4,
  },
  riskReasons: {
    marginTop: 8,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningBanner: {
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SignRequestModal;

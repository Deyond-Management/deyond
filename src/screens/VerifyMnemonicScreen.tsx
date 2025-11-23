/**
 * VerifyMnemonicScreen
 * Screen for verifying user wrote down mnemonic correctly
 * Features: random word selection, shuffled word bank, validation
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/atoms/Button';
import { Card } from '../components/atoms/Card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setStep } from '../store/slices/onboardingSlice';

interface VerifyMnemonicScreenProps {
  navigation: any;
  route: {
    params: {
      mnemonic: string[];
      password: string;
    };
  };
}

interface WordPosition {
  index: number;
  correctWord: string;
  selectedWord: string | null;
}

export const VerifyMnemonicScreen: React.FC<VerifyMnemonicScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const dispatch = useAppDispatch();
  const [selectedPositions, setSelectedPositions] = useState<WordPosition[]>([]);
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);

  // Randomly select 3 positions to verify
  const positionsToVerify = useMemo(() => {
    const positions: number[] = [];
    const indices = Array.from({ length: route.params.mnemonic.length }, (_, i) => i);

    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Take first 3
    return indices.slice(0, 3).sort((a, b) => a - b);
  }, [route.params.mnemonic]);

  // Initialize on mount
  useEffect(() => {
    // Create positions array
    const positions: WordPosition[] = positionsToVerify.map((index) => ({
      index,
      correctWord: route.params.mnemonic[index],
      selectedWord: null,
    }));
    setSelectedPositions(positions);

    // Create word bank with correct words + decoys
    const correctWords = positionsToVerify.map((i) => route.params.mnemonic[i]);
    const allWords = route.params.mnemonic;

    // Add 3-6 decoy words
    const decoys: string[] = [];
    const usedIndices = new Set(positionsToVerify);

    while (decoys.length < 3) {
      const randomIndex = Math.floor(Math.random() * allWords.length);
      if (!usedIndices.has(randomIndex)) {
        decoys.push(allWords[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }

    // Combine and shuffle
    const bank = [...correctWords, ...decoys];
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }

    setWordBank(bank);
  }, [positionsToVerify, route.params.mnemonic]);

  // Handle word selection
  const handleWordSelect = (word: string) => {
    if (currentPositionIndex >= selectedPositions.length) {
      return;
    }

    const newPositions = [...selectedPositions];
    newPositions[currentPositionIndex].selectedWord = word;
    setSelectedPositions(newPositions);

    // Move to next position
    if (currentPositionIndex < selectedPositions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1);
    }

    setError('');
  };

  // Check if all positions are filled
  const allFilled = selectedPositions.every((pos) => pos.selectedWord !== null);

  // Handle verification
  const handleVerify = async () => {
    if (!allFilled) {
      return;
    }

    // Check if all selected words are correct
    const allCorrect = selectedPositions.every(
      (pos) => pos.selectedWord === pos.correctWord
    );

    if (!allCorrect) {
      setError('Incorrect words selected. Please try again.');
      // Reset selections
      setSelectedPositions((prev) =>
        prev.map((pos) => ({ ...pos, selectedWord: null }))
      );
      setCurrentPositionIndex(0);
      return;
    }

    // Success! Navigate to BiometricSetup
    try {
      // Update step in Redux
      dispatch(setStep('biometric'));

      // Navigate to BiometricSetup
      navigation.navigate('BiometricSetup', {
        mnemonic: route.params.mnemonic,
        password: route.params.password,
      });
    } catch (error) {
      console.error('Failed to proceed:', error);
      setError('Failed to proceed. Please try again.');
    }
  };

  // Handle clear selection
  const handleClearPosition = (positionIndex: number) => {
    const newPositions = [...selectedPositions];
    newPositions[positionIndex].selectedWord = null;
    setSelectedPositions(newPositions);
    setCurrentPositionIndex(positionIndex);
    setError('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Verify Recovery Phrase</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select the correct words in order to verify you've written down your recovery
            phrase
          </Text>
        </View>

        {/* Positions to fill */}
        <Card style={styles.positionsCard}>
          {selectedPositions.map((position, index) => (
            <View key={position.index} style={styles.positionItem}>
              <Text style={[styles.positionLabel, { color: colors.textSecondary }]}>
                Word #{position.index + 1}
              </Text>
              <TouchableOpacity
                style={[
                  styles.positionSlot,
                  {
                    backgroundColor:
                      currentPositionIndex === index ? colors.primary + '15' : colors.surface,
                    borderColor:
                      currentPositionIndex === index ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleClearPosition(index)}
              >
                <Text
                  style={[
                    styles.positionText,
                    {
                      color: position.selectedWord ? colors.text.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {position.selectedWord || 'Tap to select'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Word bank */}
        <View style={styles.wordBankSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Select from these words:
          </Text>
          <View style={styles.wordBank}>
            {wordBank.map((word, index) => {
              const isUsed = selectedPositions.some((pos) => pos.selectedWord === word);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.wordOption,
                    {
                      backgroundColor: isUsed
                        ? colors.textSecondary + '30'
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => !isUsed && handleWordSelect(word)}
                  disabled={isUsed}
                  testID={`word-option-${index}`}
                  accessibilityLabel={`Word option: ${word}`}
                >
                  <Text
                    style={[
                      styles.wordOptionText,
                      {
                        color: isUsed ? colors.textSecondary : colors.text.primary,
                      },
                    ]}
                  >
                    {word}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error Message */}
        {error.length > 0 && (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        )}

        {/* Verify Button */}
        <Button
          onPress={handleVerify}
          disabled={!allFilled}
          style={styles.verifyButton}
          testID="verify-button"
        >
          Verify & Create Wallet
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  positionsCard: {
    padding: 16,
    marginBottom: 24,
  },
  positionItem: {
    marginBottom: 16,
  },
  positionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  positionSlot: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 56,
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  wordBankSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wordOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  wordOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    marginTop: 8,
  },
});

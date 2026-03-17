// ErrorBoundary — catches unhandled JS errors and shows a themed recovery screen.
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

// Inline colors/fonts to avoid import issues if the error originated from theme modules.
const BG = '#0d0a08';
const GOLD = '#b48c3c';
const TEXT_PRIMARY = '#e8dcc8';
const TEXT_SECONDARY = '#b4a888';
const TEXT_TERTIARY = '#8a7e68';
const HEADING_FONT = 'Cinzel-Bold';
const BODY_FONT = 'CrimsonText-Regular';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReturnToMenu = () => {
    this.setState({ hasError: false, error: null });
    router.replace('/menu');
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>&#x2694;</Text>
            <Text style={styles.heading}>Something Went Wrong</Text>
            <Text style={styles.subheading}>
              A dark force has disrupted your quest.
            </Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={6}>
                {this.state.error?.message ?? 'An unknown error occurred.'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={this.handleReturnToMenu}
              accessibilityRole="button"
              accessibilityLabel="Return to menu"
            >
              <Text style={styles.buttonText}>RETURN TO MENU</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
  },
  icon: {
    fontSize: 48,
    color: GOLD,
    marginBottom: 16,
  },
  heading: {
    fontFamily: HEADING_FONT,
    fontSize: 22,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(220,50,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.25)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  errorText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_TERTIARY,
  },
  button: {
    backgroundColor: 'rgba(180,140,60,0.15)',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonPressed: {
    backgroundColor: 'rgba(180,140,60,0.3)',
  },
  buttonText: {
    fontFamily: HEADING_FONT,
    fontSize: 14,
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

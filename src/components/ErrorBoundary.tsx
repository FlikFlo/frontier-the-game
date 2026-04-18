import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={styles.root}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Ошибка при запуске</Text>
            <Text style={styles.msg}>{error.message}</Text>
            {error.stack ? (
              <Text style={styles.stack}>{error.stack}</Text>
            ) : null}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2a1a1a',
  },
  scroll: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  title: {
    ...typography.h2,
    color: '#ff7a70',
    marginBottom: spacing.md,
  },
  msg: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stack: {
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});

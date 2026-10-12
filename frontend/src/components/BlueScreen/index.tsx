import { Component, type ReactNode } from 'react';
import { Crash } from './Crash';

// A crash this soon after reopening is the same crash: reopening again would not help.
const SAME_CRASH_WITHIN_MS = 10000;

interface BlueScreenProps {
  children: ReactNode;
  reload?: () => void;
}

interface BlueScreenState {
  error: Error | null;
  again: boolean;
}

/** What is shown in place of the program when rendering it throws. */
export class BlueScreen extends Component<BlueScreenProps, BlueScreenState> {
  state: BlueScreenState = { error: null, again: false };

  private reopenedAt = -Infinity;

  static getDerivedStateFromError(error: unknown): Partial<BlueScreenState> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch() {
    this.setState({ again: Date.now() - this.reopenedAt < SAME_CRASH_WITHIN_MS });
  }

  private carryOn = () => {
    if (this.state.again) {
      (this.props.reload ?? (() => window.location.reload()))();
      return;
    }
    this.reopenedAt = Date.now();
    this.setState({ error: null });
  };

  render() {
    const { error, again } = this.state;
    if (!error) return this.props.children;
    return <Crash error={error} again={again} onContinue={this.carryOn} />;
  }
}

import { Component, type ReactNode } from 'react';
import { Crash } from './Crash';

// A crash this soon after restarting is the same crash: restarting again would not help.
const SAME_CRASH_WITHIN_MS = 10000;

interface BlueScreenProps {
  /** The program, told how many times it has been restarted after a crash. */
  children: ReactNode | ((restarts: number) => ReactNode);
  reload?: () => void;
}

interface BlueScreenState {
  error: Error | null;
  again: boolean;
  restarts: number;
}

/** What is shown in place of the program when rendering it throws. */
export class BlueScreen extends Component<BlueScreenProps, BlueScreenState> {
  state: BlueScreenState = { error: null, again: false, restarts: 0 };

  private restartedAt = -Infinity;

  static getDerivedStateFromError(error: unknown): Partial<BlueScreenState> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch() {
    this.setState({ again: Date.now() - this.restartedAt < SAME_CRASH_WITHIN_MS });
  }

  private carryOn = () => {
    if (this.state.again) {
      (this.props.reload ?? (() => window.location.reload()))();
      return;
    }
    this.restartedAt = Date.now();
    this.setState(({ restarts }) => ({ error: null, restarts: restarts + 1 }));
  };

  render() {
    const { error, again, restarts } = this.state;
    const { children } = this.props;
    if (error) return <Crash error={error} again={again} onContinue={this.carryOn} />;
    return typeof children === 'function' ? children(restarts) : children;
  }
}

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; className?: string; message?: string };
type State = { failed: boolean };

/** Isolate lazy chart failures; feature owns the surrounding data-table alternative.
 * Preserve React key/remount behavior for charts whose dimensions change. */
export class ChartBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p role="alert" className={this.props.className ?? 'dw-error'}>
        {this.props.message ?? 'Không tải được biểu đồ. Hãy mở bảng số liệu.'}
      </p>
    );
  }
}

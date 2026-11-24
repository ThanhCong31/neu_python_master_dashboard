import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/expressive/button";

interface Props {
  children: ReactNode;
  screen?: string;
}
interface State { error: Error | null }

/**
 * A render-time exception must never turn the entire application into a blank
 * screen. React error boundaries catch rendering/lifecycle failures in children,
 * not network calls or errors thrown from event handlers (which need local try/catch).
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error(`[NEU] Component error${this.props.screen ? ` in ${this.props.screen}` : ""}:`, error, details.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="mx-auto my-8 flex max-w-2xl flex-col gap-4 rounded-shape-extra-large border border-error/30 bg-error-container p-6 text-on-error-container" role="alert">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-6" aria-hidden="true" />
          {this.props.screen === "login" || this.props.screen === "workspace" ? <h1 className="text-title-large font-semibold">Không thể hiển thị màn hình</h1> : <h2 className="text-title-large font-semibold">Không thể hiển thị màn hình</h2>}
        </div>
        <p className="text-body-medium">
          Đã xảy ra lỗi giao diện. Những thao tác bạn chưa lưu có thể bị mất nếu tải lại.
          Vui lòng thử mở lại màn hình hoặc quay về mục khác.
        </p>
        {import.meta.env.DEV && (
          <details className="text-body-small">
            <summary>Chi tiết lỗi dành cho lập trình viên</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          </details>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="tonal" icon={<RotateCcw />} onClick={() => this.setState({ error: null })}>Thử hiển thị lại</Button>
          <Button variant="text" onClick={() => window.location.reload()}>Tải lại ứng dụng</Button>
        </div>
      </section>
    );
  }
}

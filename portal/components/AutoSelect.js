'use client';
// A select that applies its filter as soon as it changes
export default function AutoSelect({ children, ...props }) {
  return <select {...props} onChange={e => e.currentTarget.form?.requestSubmit()}>{children}</select>;
}

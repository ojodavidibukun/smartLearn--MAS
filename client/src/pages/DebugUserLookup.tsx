import { useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const db = getFirestore();

export default function DebugUserLookup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const lookup = async () => {
    setError("");
    setResult(null);
    if (!email) return setError("Enter an email");
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      const docs: any[] = [];
      snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
      setResult(docs);
      if (docs.length === 0) setError("No user doc found for that email.");
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold mb-4">Debug: Lookup user by email</h2>
      <div className="flex gap-2 mb-4">
        <Input placeholder="email@example.com" value={email} onChange={(e:any) => setEmail(e.target.value)} />
        <Button onClick={lookup} disabled={loading}>{loading ? 'Searching...' : 'Lookup'}</Button>
      </div>
      {error && <div className="text-sm text-destructive mb-2">{error}</div>}
      {result && (
        <div className="space-y-2">
          {result.map((r:any) => (
            <pre key={r.id} className="bg-card p-4 rounded">{JSON.stringify(r, null, 2)}</pre>
          ))}
        </div>
      )}
    </div>
  );
}

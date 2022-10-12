import { useEffect, useRef, useState } from 'react'

const Instructions = () => {
  const [inpage, setInpage] = useState<boolean>();
  const [isSigning, setIsSigning] = useState<boolean>();
  const [session, setSession] = useState<{ 
    signMessage: (msg: string, target?: EventTarget) => Promise<Record<string, unknown>>, 
    verifyMessage: (msg: string, sig: string, del: string, delSig: string) => Record<string, unknown>
  } | false>();
  const [interval, setRecordedInterval] = useState<NodeJS.Timer>();
  
  const signedMessages = useRef<unknown[]>([]);
  const [signedMessageLen, setSignedMessageLen] = useState(0);

  // start a new session
  const newSession = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSession(await (window as any).signer?.newSession());
  };

  // sign a message with an inpage dialogue
  const inpageSigning = async (msg: string, target: EventTarget) => {
    console.log(msg);
    const sig = session && await session?.signMessage(msg, target);
    console.log(sig);
    setInpage(session && !(sig as { error?: string})?.error);
  };

  useEffect(() => {
    if (isSigning && session) {
      const intrv = setInterval(() => {
        const msg = `Signing message: ${signedMessages.current.length}`;
        console.log("do sign message", msg);
        // get the signed message
        session && session?.signMessage(msg).then((sig) => {
          console.log(sig, signedMessages);
          if (!sig?.error) {
            // start a new session
            signedMessages.current = [...signedMessages.current, sig];
            // count and store
            setSignedMessageLen(signedMessages.current.length);
          } else {
            // stop counting on error...
            setSession(undefined);
          }
        });
      }, 300);
      setRecordedInterval(intrv);
    } else {
      if (interval) clearInterval(interval), setRecordedInterval(undefined)
    }

    return () => {
      if (interval) clearInterval(interval), setRecordedInterval(undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSigning])

  useEffect(() => {
    if (!session) {
      setIsSigning(false)
      setRecordedInterval(undefined)
      if (interval) clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
  
  const startSigning = () => {
    setIsSigning(true);
  }

  const stopSigning = () => {
    setIsSigning(false);
  }

  return (
    <div className="h-auto items-center px-5 py-10 text-lg">
      <div className="block list-disc list-inside">
        <li>Clone the project from github <a href="https://github.com/windranger-io/surface-signer" target="_blank" rel="noreferrer">(click here)</a></li>
      </div>
      <div className="block list-disc list-inside">
        <li>Install the extension by navigating to <code>chrome://extensions</code> (copy and paste, we can&apos;t link to this page)</li>
      </div>
      <div className="block list-disc list-inside">
        <li>Click <code>Load unpacked</code> and select <code>./extension/dist</code> </li>
      </div>
      <div className="block list-disc list-inside">
        <li>Navigate back here, refresh the page and then click -&gt; <button onClick={newSession}>Approve session</button> {session ? `✅` : ``}</li>
      </div>
      <div className="block list-disc list-inside">
        <li><a onClick={(e) => inpageSigning(`Sign this example message`, e.target)}>Click here</a> to prompt an inpage delegated message signing {inpage ? `✅` : ``}</li>
      </div>
      <div className="block list-disc list-inside">
        <li><a onClick={startSigning}>Click here</a> to start signing messages automatically {signedMessageLen > 0 ? `(${signedMessageLen})` : ``}</li>
      </div>
      <div className="block list-disc list-inside">
        <li><a onClick={stopSigning}>Click here</a> to stop signing messages automatically</li>
      </div>
      <div className="block list-disc list-inside">
        <li>Open the Delegated Signing Control/History panel by clicking on the metamask icon at the bottom right of this page (after installing the extension)</li>
      </div>
    </div>
  )
}

export default Instructions

import { Action, ActionPanel, Clipboard, List, showToast, Toast } from "@raycast/api";
import { decode as decodeBase64 } from "js-base64";
import { useEffect, useState } from "react";

export default function Command() {
  const { clipboardContent, error } = useClipboard();

  let jwt;

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Could not read clipboard",
      message: error.message,
    });
  } else if (clipboardContent) {
    try {
      jwt = parseJWT(clipboardContent);
    } catch (error: any) {
      showToast({
        style: Toast.Style.Failure,
        title: "Could not parse JWT",
        message: error.message,
      });
    }
  }

  return (
    <List>
      {jwt ? (
        <>
          <List.Section title="Payload">
            {Object.entries(jwt.payload).map(([claim, value]) => (
              <JWTClaim key={claim} claim={claim} value={value} />
            ))}
          </List.Section>

          <List.Section title="Header">
            {Object.entries(jwt.header).map(([claim, value]) => (
              <JWTClaim key={claim} claim={claim} value={value} />
            ))}
          </List.Section>

          <List.Section title="Signature">
            <List.Item
              title="Signature"
              subtitle={jwt.signature}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard content={`${jwt.signature}`} />
                </ActionPanel>
              }
            />
          </List.Section>
        </>
      ) : (
        <List.EmptyView title={"Copy a JWT and then run this command"}></List.EmptyView>
      )}
    </List>
  );
}

const JWTClaim = ({ claim, value }: { claim: string; value: unknown }) => {
  const accessories: List.Item.Accessory[] = [];

  let date: Date | undefined;

  if (typeof value === "number") {
    date = new Date(value * 1000);
    accessories.push({
      text: date.toLocaleString(),
    });
  }

  return (
    <List.Item
      title={claim}
      subtitle={`${value}`}
      accessories={accessories}
      detail={<List.Item.Detail markdown={"Foo!"} />}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={`${value}`} />
          {date && (
            <>
              <Action.CopyToClipboard title="Copy ISO Timestamp" content={date.toISOString()} />
              <Action.CopyToClipboard title="Copy Locale Timestamp" content={date.toLocaleString()} />
            </>
          )}
        </ActionPanel>
      }
    />
  );
};

const useClipboard = () => {
  const [clipboardContent, setClipboardContent] = useState<string>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    Clipboard.readText().then(setClipboardContent).catch(setError);
  }, [clipboardContent]);

  return { clipboardContent, error };
};

const parseJWT = (str: string) => {
  const split = str.split(".");
  if (split.length != 3) throw new Error("Not a valid JWT");
  const header = JSON.parse(decodeBase64(split[0]));
  const payload = JSON.parse(decodeBase64(split[1]));
  const jwt = {
    header,
    payload,
    signature: split[2],
  };

  return jwt;
};

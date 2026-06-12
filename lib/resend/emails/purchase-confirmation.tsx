import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PurchaseConfirmationEmailProps {
  productName: string;
  dashboardUrl: string;
}

export function PurchaseConfirmationEmail({ productName, dashboardUrl }: PurchaseConfirmationEmailProps) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Zakup potwierdzony — masz dostęp do {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Dziękujemy za zakup!</Heading>
          <Text style={text}>
            Twój zakup <strong>{productName}</strong> został potwierdzony.
          </Text>
          <Text style={text}>
            Możesz teraz przejść do swojego konta i rozpocząć naukę.
          </Text>
          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Przejdź do kursu
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Jeśli to nie Ty dokonałeś/aś zakupu, skontaktuj się z nami.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const h1: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const text: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "16px 0 32px",
};

const button: React.CSSProperties = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
};

const hr: React.CSSProperties = {
  borderColor: "#e6e6e6",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#9a9a9a",
  margin: "0",
};

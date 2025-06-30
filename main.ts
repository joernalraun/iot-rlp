/**
 * Custom Server Extension for Thingsboard
 * Erweitert die Grove WiFi-Funktionalität um Thingsboard-Server-Verbindung
 */

//% weight=5 color=#FF6B35 icon="\uf0c2" block="RLP-IoT-Server"
//% groups='["Server Communication"]'
namespace customServer {
    
    /**
     * Send data to Thingsboard server
     * @param apiToken Thingsboard device access token
     * @param data1 First data value
     * @param data2 Second data value
     * @param data3 Third data value
     * @param data4 Fourth data value
     * @param data5 Fifth data value
     * @param data6 Sixth data value
     * @param data7 Seventh data value
     * @param data8 Eighth data value
     */
    //% block="Thingsboard-Server|API Token %apiToken|Daten_1 %data1||Daten_2 %data2|Daten_3 %data3|Daten_4 %data4|Daten_5 %data5|Daten_6 %data6|Daten_7 %data7|Daten_8 %data8"
    //% group="Server Communication"
    //% expandableArgumentMode="enabled"
    //% apiToken.defl="Token"
    export function sendToThingsboard(
        apiToken: string,
        data1: number = 0, 
        data2: number = 0, 
        data3: number = 0, 
        data4: number = 0,
        data5: number = 0,
        data6: number = 0,
        data7: number = 0,
        data8: number = 0
    ) {
        // Feste Server-Konfiguration für Thingsboard
        const serverUrl = "paminasogo.ddns.net";
        const port = "9090";
        // const endpoint = "/api/v1/telemetry";

        // Überprüfe ob WiFi verbunden ist (Grove Extension Funktion)
        if (!grove.wifiOK()) {
            return;
        }

        let result = 0;
        let retry = 2;

        // Schließe vorherige TCP Verbindung
        sendAtCommand("AT+CIPCLOSE");
        waitForAtResponse("OK", "ERROR", "None", 2000);

        while (retry > 0) {
            retry = retry - 1;

            // Etabliere TCP Verbindung
            sendAtCommand(`AT+CIPSTART="TCP","${serverUrl}",${port}`);
            result = waitForAtResponse("OK", "ALREADY CONNECTED", "ERROR", 2000);
            if (result == 3) continue;

            // Erstelle JSON Payload für Thingsboard
            let jsonData = `{"data1":${data1},"data2":${data2},"data3":${data3},"data4":${data4},"data5":${data5},"data6":${data6},"data7":${data7},"data8":${data8}}`;
            
            // Erstelle HTTP POST Request für Thingsboard
            let httpRequest = `POST ${endpoint} HTTP/1.1\r\n`;
            httpRequest += `Host: ${serverUrl}\r\n`;
            httpRequest += `X-Authorization: Bearer ${apiToken}\r\n`;
            httpRequest += `Content-Type: application/json\r\n`;
            httpRequest += `Content-Length: ${jsonData.length}\r\n\r\n`;
            httpRequest += jsonData;

            // Sende Daten
            sendAtCommand(`AT+CIPSEND=${httpRequest.length}`);
            result = waitForAtResponse(">", "OK", "ERROR", 2000);
            if (result == 3) continue;

            sendAtCommand(httpRequest);
            result = waitForAtResponse("SEND OK", "SEND FAIL", "ERROR", 5000);
            if (result == 1) break;
        }

        // Schließe TCP Verbindung
        sendAtCommand("AT+CIPCLOSE");
        waitForAtResponse("OK", "ERROR", "None", 2000);
    }

    // Hilfsfunktionen - diese greifen auf die gleichen Serial-Funktionen zu wie Grove
    function sendAtCommand(cmd: string) {
        serial.writeString(cmd + "\u000D\u000A");
    }

    function waitForAtResponse(target1: string, target2: string, target3: string, timeout: number): number {
        let buffer = "";
        let start = input.runningTime();

        while ((input.runningTime() - start) < timeout) {
            buffer += serial.readString();

            if (buffer.includes(target1)) return 1;
            if (buffer.includes(target2)) return 2;
            if (buffer.includes(target3)) return 3;

            basic.pause(100);
        }

        return 0;
    }
}

const {fetch_ticket_by_id, fetch_time_entries_for_ticket} = require("./connectwiseAPI"); // ConnectWise API logic
const { get_attr_or_key } = require("./connectwiseHelpers");
const { summarizeJSON } = require("../OpenAI/openaiSummarizer");

async function handleTicketRequest(context, ticketId) {
    try {
      // Fetch the ticket info
      const ticketInfo = await fetch_ticket_by_id(ticketId);

      // Fetch related time entries
      const timeEntries = await fetch_time_entries_for_ticket(ticketId);

      // Log the combined data to check if it's being passed correctly
      //console.log("Debug Log: Combined data being passed to OpenAI:", combinedData);

      // Summarize the combined data
      const combinedSummary = await summarizeJSON(context, timeEntries);

      // Send the formatted details back to the user
      const formattedTicketDetails =
        `**ID:** ${get_attr_or_key(ticketInfo, "id")}\n\n` +
        `**Summary:** ${get_attr_or_key(ticketInfo, "summary")}\n\n` +
        `**Record Type:** ${get_attr_or_key(ticketInfo, "recordType")}\n\n` +
        `**Company:** ${get_attr_or_key(ticketInfo.company, "name")}\n\n` +
        `**Board:** ${get_attr_or_key(ticketInfo.board, "name")}\n\n` +
        `**Status:** ${get_attr_or_key(ticketInfo.status, "name")}\n\n` +
        `**Priority:** ${get_attr_or_key(ticketInfo.priority, "name")}\n\n` +
        `**Assigned to:** ${get_attr_or_key(ticketInfo, "resources")}\n\n` +
        `**Actual Hours:** ${get_attr_or_key(ticketInfo, "actualHours")}\n\n`;

      const fullMessage = `${formattedTicketDetails}\n\n**Time Entries Summary:**\n${combinedSummary}`;

      // Split and send the message in chunks if too long
      const chunkSize = 2000;
      for (let i = 0; i < fullMessage.length; i += chunkSize) {
        const messageChunk = fullMessage.slice(i, i + chunkSize);
        await context.sendActivity(messageChunk);
      }
    } catch (error) {
      await context.sendActivity(
        `Sorry, I encountered an error while processing the ticket ID: ${ticketId}`
      );
      console.error("Error fetching ticket or time entries:", error);
    }
  }
module.exports = { handleTicketRequest };
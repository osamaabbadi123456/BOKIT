module.exports = (content) => `
  <div style="background: #f5f5f5; padding: 40px; font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
      </div>
      ${content}
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
        This message was sent by BOKIT — Book it and kick it ⚽<br/>
        Please do not reply to this email.
      </p>
    </div>
  </div>
`;

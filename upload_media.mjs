import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient('https://auejzkznrhmstdzgtayb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZWp6a3pucmhtc3Rkemd0YXliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUxMDgwMSwiZXhwIjoyMTA0MDg2ODAxfQ.-zXoee5BgH8U1puEb2VsbMFDCvK-J_UWONksKGwc2dg');
const dir = 'g:/Techhandlers website/bucket-media-files';

async function uploadFiles() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.zip')) continue;
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage.from('media').upload(file, content, { upsert: true });
    if (error) console.error('Error uploading', file, error.message);
    else console.log('Uploaded', file);
  }
}
uploadFiles();
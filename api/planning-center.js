const PCO_BASE = 'https://api.planningcenteronline.com';

function getAuthHeader() {
  const id = process.env.PCO_APP_ID;
  const secret = process.env.PCO_SECRET;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function pcoFetch(path) {
  const response = await fetch(`${PCO_BASE}${path}`, {
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PCO ${response.status}: ${text}`);
  }
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, serviceTypeId, planId, attachmentId } = req.query;

  try {
    if (action === 'me') {
      const data = await pcoFetch('/services/v2/me');
      return res.status(200).json(data);
    }

    if (action === 'myPlans') {
      const me = await pcoFetch('/services/v2/me');
      const personId = me?.data?.id;
      if (!personId) throw new Error('Could not get person ID');
      const data = await pcoFetch(
        `/services/v2/people/${personId}/plan_people?filter=future&order=sort_date&per_page=20&include=plan,service_type`
      );
      return res.status(200).json(data);
    }

    if (action === 'planItems' && serviceTypeId && planId) {
      const data = await pcoFetch(
        `/services/v2/service_types/${serviceTypeId}/plans/${planId}/items?include=song,arrangement,key&per_page=25`
      );
      return res.status(200).json(data);
    }

    if (action === 'attachments' && serviceTypeId && planId) {
      const planAttachments = await pcoFetch(
        `/services/v2/service_types/${serviceTypeId}/plans/${planId}/attachments?per_page=50`
      );
      let itemAttachments = { data: [] };
      try {
        itemAttachments = await pcoFetch(
          `/services/v2/service_types/${serviceTypeId}/plans/${planId}/items?include=attachments&per_page=25`
        );
      } catch (e) {}

      const allPlan = planAttachments.data || [];
      const allItem = itemAttachments.included?.filter(i => i.type === 'Attachment') || [];
      console.log('ATTACH plan count:', allPlan.length, 'item count:', allItem.length);
      console.log('ATTACH filenames:', JSON.stringify([...allPlan, ...allItem].map(a => a.attributes?.filename || a.attributes?.content_type || 'unknown')));

      return res.status(200).json({
        planAttachments: allPlan,
        itemAttachments: allItem,
        items: itemAttachments.data || [],
      });
    }

    if (action === 'attachmentUrl' && serviceTypeId && planId && attachmentId) {
      // Get attachment metadata first
      const attachData = await pcoFetch(
        `/services/v2/service_types/${serviceTypeId}/plans/${planId}/attachments/${attachmentId}`
      );
      const attrs = attachData?.data?.attributes || {};
      console.log('ATTACHURL attrs:', JSON.stringify({ filename: attrs.filename, content_type: attrs.content_type, file_download_url: attrs.file_download_url, open_url: attrs.open_url }));

      // Try /open for a signed URL
      try {
        const openData = await pcoFetch(
          `/services/v2/service_types/${serviceTypeId}/plans/${planId}/attachments/${attachmentId}/open`
        );
        console.log('OPEN success:', JSON.stringify(openData?.data?.attributes));
        return res.status(200).json(openData);
      } catch (e) {
        console.log('OPEN failed:', e.message, 'using direct attrs');
        return res.status(200).json(attachData);
      }
    }

    return res.status(400).json({ error: 'Unknown action or missing params' });

  } catch (error) {
    console.error('PCO proxy error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

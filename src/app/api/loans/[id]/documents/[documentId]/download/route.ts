import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; documentId: string }> }
) {
    try {
        // Await params in Next.js 15+
        const { id, documentId } = await params;

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const laravelUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(
            `${laravelUrl}/api/loans/${id}/documents/${documentId}/download`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Document Download] Error:', errorText);

            return NextResponse.json(
                { message: 'Failed to download document' },
                { status: response.status }
            );
        }

        // Get the blob from Laravel
        const blob = await response.blob();

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `document_${documentId}.pdf`;

        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        // Create response with the blob
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);

        return new NextResponse(blob, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('[Document Download] Error:', error);
        return NextResponse.json(
            { message: 'An error occurred while downloading document' },
            { status: 500 }
        );
    }
}
import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';

// These photographs are already tracked in public/images/bikes, so the
// website can render bikes even when a /storage/* upload is unavailable.
const knownModels = [
    [/dio/i, 'honda-dio-dlx.jpg'],
    [/h'?ness|cb350|highness/i, 'honda-hness.jpg'],
    [/classic\s*350|classic/i, 'royal-enfield-classic.jpg'],
    [/activa/i, 'honda-activa.jpg'],
    [/access/i, 'suzuki-access-125.jpg'],
    [/ntorq/i, 'tvs-ntorq-125.jpg'],
    [/jupiter/i, 'jupiter-125-grey.jpg'],
    [/burgman/i, 'suzuki-burgman.jpg'],
    [/fascino/i, 'yamaha-fascino-125.jpg'],
    [/meteor/i, 'meteor-fireball-yellow.jpg'],
    [/duke/i, 'duke-250-orange.jpg'],
    [/r15/i, 'r15-racing-blue.jpg'],
    [/ather/i, 'ather-450x-white.jpg'],
    [/ola/i, 'ola-s1-black.jpg'],
    [/orbiter/i, 'tvs-orbiter.jpg'],
];

const unique = (values) => [...new Set(values.filter(Boolean))];

export function bikeImageCandidates(bike) {
    const label = [bike?.brand, bike?.model_name].filter(Boolean).join(' ');
    const localMatch = knownModels.find(([pattern]) => pattern.test(label));
    // Prefer the actual uploaded vehicle photo; try matching catalog imagery if the URL fails.
    return unique([
        bike?.primary_image_url,
        localMatch ? '/images/bikes/' + localMatch[1] : null,
        '/images/services/two_wheelers.jpg',
    ]);
}

export default function BikeImage({ bike, alt, sx = {}, eager = false, imageOnly = false }) {
    const candidates = useMemo(
        () => bikeImageCandidates(bike),
        [bike?.brand, bike?.model_name, bike?.primary_image_url],
    );
    const [candidateIndex, setCandidateIndex] = useState(0);
    useEffect(() => { setCandidateIndex(0); }, [candidates.join('|')]);

    const source = candidates[candidateIndex];
    const nextImage = () => setCandidateIndex((index) => index + 1);
    const name = alt || [bike?.brand, bike?.model_name].filter(Boolean).join(' ') || 'Rental bike';

    return (
        <Box sx={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', bgcolor: '#EEF2EE', ...sx,
        }}>
            {source ? (
                <Box component="img" src={source} alt={name}
                    loading={eager ? 'eager' : 'lazy'}
                    fetchPriority={eager ? 'high' : undefined}
                    onError={nextImage}
                    sx={{
                        display: 'block', width: '100%', height: '100%',
                        objectFit: imageOnly ? 'cover' : 'contain',
                        p: imageOnly ? 0 : { xs: 2, md: 2.5 },
                        boxSizing: 'border-box',
                    }}
                />
            ) : (
                <Box role="img" aria-label={name} sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 1, color: '#667A74',
                }}>
                    <TwoWheelerOutlinedIcon aria-hidden="true" sx={{ fontSize: 70 }} />
                    <Box component="span" sx={{ fontSize: 13, fontWeight: 650, textAlign: 'center', px: 2 }}>
                        {name}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

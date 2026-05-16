import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useCommunity, type Post } from '@/context/CommunityContext';

// ─── Category pill ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Postpartum BP':        { bg: '#FDEDEC', text: '#C0392B' },
  'Gestational Diabetes': { bg: '#FEF9E7', text: '#B7770D' },
  'Postpartum Anxiety':   { bg: '#EBF5FB', text: '#1A5276' },
  'A1C & Long-Term Health': { bg: '#EAFAF1', text: '#1E8449' },
  'Advocacy':             { bg: '#F5EEF8', text: '#6C3483' },
};

function CategoryPill({ label }: { label: string }) {
  const colors = CATEGORY_COLORS[label] ?? { bg: '#F0EBF5', text: '#9B59B6' };
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { toggleUpvote } = useCommunity();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/thread/${post.id}`)}
      activeOpacity={0.92}
    >
      {/* Top row: category + author */}
      <View style={styles.cardMeta}>
        <CategoryPill label={post.category} />
        <Text style={styles.author}>{post.authorName}</Text>
      </View>

      {/* Title */}
      <Text style={styles.postTitle}>{post.title}</Text>

      {/* Body snippet */}
      <Text style={styles.postSnippet} numberOfLines={2}>{post.body}</Text>

      {/* Action row */}
      <View style={styles.actionRow}>
        {/* Upvote */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={(e) => { e.stopPropagation?.(); toggleUpvote(post.id); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome
            name={post.upvoted ? 'arrow-up' : 'arrow-up'}
            size={13}
            color={post.upvoted ? '#9B59B6' : '#bbb'}
          />
          <Text style={[styles.actionCount, post.upvoted && styles.actionCountActive]}>
            {post.upvoteCount}
          </Text>
        </TouchableOpacity>

        {/* Comment count */}
        <View style={styles.actionBtn}>
          <FontAwesome name="comment-o" size={13} color="#bbb" />
          <Text style={styles.actionCount}>{post.comments.length}</Text>
        </View>

        {/* Read thread cue */}
        <Text style={styles.readThread}>Read thread →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { posts } = useCommunity();

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.container}
      data={posts}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Together We're Stronger</Text>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSub}>
            Real experiences from mothers navigating maternal health. Tap a post to join the conversation.
          </Text>
        </View>
      }
      renderItem={({ item }) => <PostCard post={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={<View style={{ height: 32 }} />}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20 },

  header: { marginBottom: 20, marginTop: 4 },
  headerEyebrow: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle:   { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  headerSub:     { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  pill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontWeight: '700' },

  author: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 21,
    marginBottom: 6,
  },
  postSnippet: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 14,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EBF5',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount:       { fontSize: 13, color: '#bbb', fontWeight: '600' },
  actionCountActive: { color: '#9B59B6' },

  readThread: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9B59B6',
    fontWeight: '600',
  },
});

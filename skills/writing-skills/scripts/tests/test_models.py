"""Tests for skill data-model outputs, optional fields and copy semantics."""

from skills_ref.models import SkillProperties


def test_to_dict_copies_metadata():
    props = SkillProperties(
        name='my-skill', description='A test skill', metadata={'author': 'Test Author'}
    )
    result = props.to_dict()
    metadata = result['metadata']
    assert isinstance(metadata, dict)
    metadata['author'] = 'Changed Author'
    assert props.metadata == {'author': 'Test Author'}


def test_to_dict_omits_absent_optional_fields():
    props = SkillProperties(name='my-skill', description='A test skill')
    assert props.to_dict() == {'name': 'my-skill', 'description': 'A test skill'}


def test_to_dict_includes_all_present_optional_fields():
    props = SkillProperties(
        name='my-skill',
        description='A test skill',
        license='MIT',
        compatibility='Python 3.11+',
        allowed_tools='Read',
        metadata={'owner': 'example'},
    )
    assert props.to_dict() == {
        'name': 'my-skill',
        'description': 'A test skill',
        'license': 'MIT',
        'compatibility': 'Python 3.11+',
        'allowed-tools': 'Read',
        'metadata': {'owner': 'example'},
    }
